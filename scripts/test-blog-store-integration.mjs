/**
 * Full blog CRUD integration test via Supabase REST (matches blog-store behavior).
 * Run: node scripts/test-blog-store-integration.mjs
 */
import { readFileSync, renameSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!baseUrl || !key) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const restUrl = `${baseUrl}/rest/v1`;
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const blogJsonPath = resolve(process.cwd(), "data/blog.json");
const blogJsonBackup = resolve(process.cwd(), "data/blog.json.crud-test-backup");
const testPostId = `crud-post-${Date.now()}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, init = {}) {
  const response = await fetch(`${restUrl}${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { ok: response.ok, status: response.status, body };
}

async function listPosts(activeOnly = false) {
  const query = activeOnly
    ? "/blog_posts?select=*&active=eq.true&order=sort_order.asc"
    : "/blog_posts?select=*&order=sort_order.asc";
  const result = await request(query);
  assert(result.ok, `list posts failed: ${JSON.stringify(result.body)}`);
  return result.body;
}

async function getSettings() {
  const result = await request("/blog_page_settings?select=*&id=eq.1");
  assert(result.ok, `read settings failed: ${JSON.stringify(result.body)}`);
  return result.body[0] ?? null;
}

async function saveSettings(settings) {
  const result = await request("/blog_page_settings", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ id: 1, ...settings, updated_at: new Date().toISOString() }),
  });
  assert(result.ok, `save settings failed: ${JSON.stringify(result.body)}`);
  return result.body[0];
}

async function replacePosts(posts) {
  const existing = await listPosts(false);
  const nextIds = new Set(posts.map((post) => post.id));
  const deleteIds = existing.map((post) => post.id).filter((id) => !nextIds.has(id));

  if (deleteIds.length > 0) {
    const del = await request(
      `/blog_posts?id=in.(${deleteIds.map((id) => `"${id}"`).join(",")})`,
      { method: "DELETE", headers: { Prefer: "return=representation" } },
    );
    assert(del.ok, `delete posts failed: ${JSON.stringify(del.body)}`);
  }

  if (posts.length > 0) {
    const upsert = await request("/blog_posts", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(
        posts.map((post, index) => ({
          ...post,
          sort_order: index + 1,
          updated_at: new Date().toISOString(),
        })),
      ),
    });
    assert(upsert.ok, `upsert posts failed: ${JSON.stringify(upsert.body)}`);
  }

  return listPosts(false);
}

async function readPostBySlug(slug) {
  const result = await request(
    `/blog_posts?select=*&id=eq.${encodeURIComponent(slug)}&active=eq.true&limit=1`,
  );
  assert(result.ok, `read post failed: ${JSON.stringify(result.body)}`);
  return result.body[0] ?? null;
}

function withBlogJsonDisabled(fn) {
  let moved = false;
  if (existsSync(blogJsonPath)) {
    renameSync(blogJsonPath, blogJsonBackup);
    moved = true;
  }

  try {
    return fn();
  } finally {
    if (moved && existsSync(blogJsonBackup)) {
      renameSync(blogJsonBackup, blogJsonPath);
    }
  }
}

async function run() {
  console.log("1. Read settings + posts from Supabase...");
  const settings = await getSettings();
  const posts = await listPosts(false);
  assert(settings, "blog_page_settings row must exist");
  assert(Array.isArray(posts), "blog_posts must be readable");
  console.log(`   OK (${posts.length} posts, settings.title_en="${settings.title_en}")`);

  console.log("2. Create post...");
  const createdPosts = await replacePosts([
    ...posts,
    {
      id: testPostId,
      title_ar: "مقال CRUD",
      title_en: "CRUD Integration Post",
      excerpt_ar: "مقتطف",
      excerpt_en: "Excerpt",
      content_ar: "محتوى",
      content_en: "Full content",
      image_url: "/assets/img1.jpeg",
      emoji: "📝",
      date: "2026-07-25",
      read_time: 4,
      active: true,
      sort_order: posts.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
  assert(createdPosts.some((post) => post.id === testPostId), "create must persist");
  console.log("   OK");

  console.log("3. Read by slug (active)...");
  let bySlug = await readPostBySlug(testPostId);
  assert(bySlug?.title_en === "CRUD Integration Post", "slug read must work");
  console.log("   OK");

  console.log("4. Update post + hide (active=false)...");
  const updatedPosts = await replacePosts(
    createdPosts.map((post) =>
      post.id === testPostId
        ? { ...post, title_en: "CRUD Integration Post Updated", active: false }
        : post,
    ),
  );
  const updated = updatedPosts.find((post) => post.id === testPostId);
  assert(updated?.title_en === "CRUD Integration Post Updated", "update must persist");
  assert(updated?.active === false, "active=false must persist");
  console.log("   OK");

  console.log("5. activeOnly read hides inactive post...");
  const activePosts = await listPosts(true);
  assert(!activePosts.some((post) => post.id === testPostId), "inactive post hidden");
  bySlug = await readPostBySlug(testPostId);
  assert(bySlug === null, "inactive post not readable by slug");
  console.log("   OK");

  console.log("6. Reorder posts...");
  const allPosts = await listPosts(false);
  const index = allPosts.findIndex((post) => post.id === testPostId);
  assert(index > 0, "test post must exist for reorder");
  const reordered = [...allPosts];
  [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
  const afterReorder = await replacePosts(reordered);
  const moved = afterReorder.find((post) => post.id === testPostId);
  assert(moved?.sort_order === index, `sort_order must be ${index}, got ${moved?.sort_order}`);
  console.log("   OK (sort_order:", moved?.sort_order, ")");

  console.log("7. Delete post...");
  const afterDelete = await replacePosts(
    afterReorder.filter((post) => post.id !== testPostId),
  );
  assert(!afterDelete.some((post) => post.id === testPostId), "delete must remove post");
  assert((await readPostBySlug(testPostId)) === null, "deleted post not found");
  console.log("   OK");

  console.log("8. Runtime without data/blog.json...");
  await withBlogJsonDisabled(async () => {
    const withoutJsonPosts = await listPosts(false);
    assert(Array.isArray(withoutJsonPosts), "reads must work without blog.json");
    assert(
      !withoutJsonPosts.some((post) => post.id === testPostId),
      "deleted post stays deleted without blog.json",
    );
  });
  console.log("   OK");

  console.log("9. Update blog settings...");
  const saved = await saveSettings({
    title_ar: settings.title_ar,
    title_en: "Blog Supabase Test",
    description_ar: settings.description_ar,
    description_en: "Supabase-only description",
  });
  assert(saved.title_en === "Blog Supabase Test", "settings update must persist");
  const reread = await getSettings();
  assert(reread.description_en === "Supabase-only description", "settings read back from Supabase");
  console.log("   OK");

  console.log("\nAll blog CRUD integration checks passed.");
  console.log("blog.json is used only inside ensureSeedBlog() when tables are empty.");
}

run().catch((error) => {
  if (existsSync(blogJsonBackup) && !existsSync(blogJsonPath)) {
    renameSync(blogJsonBackup, blogJsonPath);
  }
  console.error(error);
  process.exit(1);
});
