/**
 * Test blog tables via Supabase REST.
 * Run: node scripts/test-blog-crud.mjs
 */
import { readFileSync } from "node:fs";
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

const testPostId = `test-post-${Date.now()}`;

async function run() {
  console.log("0. Check blog tables...");
  const settingsCheck = await request("/blog_page_settings?select=id&limit=1");
  const postsCheck = await request("/blog_posts?select=id&limit=1");
  if (!settingsCheck.ok || !postsCheck.ok) {
    console.error("SCHEMA CHECK FAILED:", settingsCheck.body, postsCheck.body);
    console.error("\nApply migration: supabase/migrations/20260725160000_create_blog_tables.sql");
    process.exit(1);
  }
  console.log("   OK");

  console.log("1. Upsert blog settings...");
  const settings = await request("/blog_page_settings", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: 1,
      title_ar: "المدونة",
      title_en: "Blog Test",
      description_ar: "وصف",
      description_en: "Description",
    }),
  });
  if (!settings.ok) {
    console.error("SETTINGS FAILED:", settings.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("2. Create blog post...");
  const created = await request("/blog_posts", {
    method: "POST",
    body: JSON.stringify({
      id: testPostId,
      title_ar: "اختبار",
      title_en: "Test Post",
      excerpt_ar: "مقتطف",
      excerpt_en: "Excerpt",
      content_ar: "محتوى",
      content_en: "Content",
      image_url: "/assets/img1.jpeg",
      emoji: "📝",
      date: "2026-07-25",
      read_time: 3,
      active: true,
      sort_order: 999,
    }),
  });
  if (!created.ok) {
    console.error("CREATE FAILED:", created.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("3. Update blog post...");
  const updated = await request(`/blog_posts?id=eq.${encodeURIComponent(testPostId)}`, {
    method: "PATCH",
    body: JSON.stringify({ title_en: "Test Post Updated", active: false }),
  });
  if (!updated.ok) {
    console.error("UPDATE FAILED:", updated.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("4. Delete blog post...");
  const deleted = await request(
    `/blog_posts?id=eq.${encodeURIComponent(testPostId)}`,
    { method: "DELETE", headers: { Prefer: "return=representation" } },
  );
  if (!deleted.ok) {
    console.error("DELETE FAILED:", deleted.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("\nAll blog checks passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
