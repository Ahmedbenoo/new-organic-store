import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type {
  BlogData,
  BlogPageSettings,
  BlogPostRecord,
} from "@/lib/types";

const BLOG_SETTINGS_ID = 1;
const legacyBlogFile = path.join(process.cwd(), "data", "blog.json");

type BlogPageSettingsRow = BlogPageSettings & {
  id: number;
  updated_at: string;
};

type BlogPostRow = {
  id: string;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  content_ar: string;
  content_en: string;
  image_url: string;
  emoji: string;
  date: string;
  read_time: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function getClient() {
  return getSupabaseAdminClient();
}

function sortPosts(posts: BlogPostRecord[]) {
  return posts.sort((a, b) => a.sort_order - b.sort_order);
}

function rowToPost(row: BlogPostRow): BlogPostRecord {
  return {
    id: row.id,
    title_ar: row.title_ar,
    title_en: row.title_en,
    excerpt_ar: row.excerpt_ar,
    excerpt_en: row.excerpt_en,
    content_ar: row.content_ar,
    content_en: row.content_en,
    image_url: row.image_url,
    emoji: row.emoji,
    date: row.date,
    read_time: row.read_time,
    active: row.active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function postToRow(post: BlogPostRecord): BlogPostRow {
  return {
    id: post.id,
    title_ar: post.title_ar,
    title_en: post.title_en,
    excerpt_ar: post.excerpt_ar,
    excerpt_en: post.excerpt_en,
    content_ar: post.content_ar,
    content_en: post.content_en,
    image_url: post.image_url,
    emoji: post.emoji,
    date: post.date,
    read_time: post.read_time,
    active: post.active,
    sort_order: post.sort_order,
    created_at: post.created_at,
    updated_at: post.updated_at,
  };
}

function rowToSettings(row: BlogPageSettingsRow): BlogPageSettings {
  return {
    title_ar: row.title_ar,
    title_en: row.title_en,
    description_ar: row.description_ar,
    description_en: row.description_en,
  };
}

async function loadLegacyJsonBlog() {
  try {
    const raw = await readFile(legacyBlogFile, "utf8");
    return JSON.parse(raw) as BlogData;
  } catch {
    return null;
  }
}

async function readSettingsRow() {
  const { data, error } = await getClient()
    .from("blog_page_settings")
    .select("*")
    .eq("id", BLOG_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read blog settings: ${error.message}`);
  }

  return data as BlogPageSettingsRow | null;
}

async function readPostsRows(options?: { activeOnly?: boolean }) {
  let query = getClient()
    .from("blog_posts")
    .select("*")
    .order("sort_order", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to read blog posts: ${error.message}`);
  }

  return ((data ?? []) as BlogPostRow[]).map(rowToPost);
}

async function ensureSeedBlog() {
  const supabase = getClient();
  const [{ count: postsCount, error: postsError }, settingsRow] =
    await Promise.all([
      supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true }),
      readSettingsRow(),
    ]);

  if (postsError) {
    throw new Error(`Failed to check blog_posts table: ${postsError.message}`);
  }

  if ((postsCount ?? 0) > 0 && settingsRow) {
    return;
  }

  const legacy = await loadLegacyJsonBlog();
  if (!legacy) {
    return;
  }

  if (!settingsRow && legacy.settings) {
    const now = new Date().toISOString();
    const { error: settingsError } = await supabase
      .from("blog_page_settings")
      .insert({
        id: BLOG_SETTINGS_ID,
        ...legacy.settings,
        updated_at: now,
      });

    if (settingsError) {
      throw new Error(`Failed to seed blog settings: ${settingsError.message}`);
    }
  }

  if ((postsCount ?? 0) === 0 && legacy.posts?.length) {
    const rows = sortPosts(legacy.posts).map((post) => postToRow(post));
    const { error: postsInsertError } = await supabase
      .from("blog_posts")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: true });

    if (postsInsertError) {
      throw new Error(`Failed to seed blog posts: ${postsInsertError.message}`);
    }
  }
}

async function readSettings(): Promise<BlogPageSettings> {
  const row = await readSettingsRow();
  if (row) {
    return rowToSettings(row);
  }

  return {
    title_ar: "المدونة",
    title_en: "Blog",
    description_ar: "",
    description_en: "",
  };
}

export async function readBlogData(options?: { activeOnly?: boolean }) {
  await ensureSeedBlog();

  const [settings, posts] = await Promise.all([
    readSettings(),
    readPostsRows(options),
  ]);

  return {
    settings,
    posts: sortPosts(posts),
  };
}

export async function readBlogPostBySlug(slug: string) {
  await ensureSeedBlog();

  const { data, error } = await getClient()
    .from("blog_posts")
    .select("*")
    .eq("id", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read blog post: ${error.message}`);
  }

  return data ? rowToPost(data as BlogPostRow) : null;
}

export async function saveBlogData(input: Partial<BlogData>) {
  const current = await readBlogData();
  const now = new Date().toISOString();

  const settings: BlogPageSettings = {
    ...current.settings,
    ...input.settings,
  };

  const posts = sortPosts(
    (input.posts ?? current.posts).map((post, index) => ({
      ...post,
      sort_order: index + 1,
      updated_at: now,
      created_at: post.created_at || now,
    })),
  );

  const supabase = getClient();

  const { error: settingsError } = await supabase
    .from("blog_page_settings")
    .upsert(
      {
        id: BLOG_SETTINGS_ID,
        ...settings,
        updated_at: now,
      },
      { onConflict: "id" },
    );

  if (settingsError) {
    throw new Error(`Failed to save blog settings: ${settingsError.message}`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("blog_posts")
    .select("id");

  if (existingError) {
    throw new Error(`Failed to read existing blog posts: ${existingError.message}`);
  }

  const nextIds = new Set(posts.map((post) => post.id));
  const idsToDelete = (existing ?? [])
    .map((row) => row.id as string)
    .filter((id) => !nextIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("blog_posts")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      throw new Error(`Failed to delete removed blog posts: ${deleteError.message}`);
    }
  }

  if (posts.length > 0) {
    const rows = posts.map((post) => postToRow(post));
    const { error: upsertError } = await supabase
      .from("blog_posts")
      .upsert(rows, { onConflict: "id" });

    if (upsertError) {
      throw new Error(`Failed to save blog posts: ${upsertError.message}`);
    }
  }

  return { settings, posts };
}

export function getBlogLocalizedField(
  post: BlogPostRecord,
  baseKey: "title" | "excerpt" | "content",
  locale: string,
) {
  const key = `${baseKey}_${locale === "ar" ? "ar" : "en"}` as keyof BlogPostRecord;
  return String(post[key] ?? "");
}

export function getBlogSettingsField(
  settings: BlogPageSettings,
  baseKey: "title" | "description",
  locale: string,
) {
  const key = `${baseKey}_${locale === "ar" ? "ar" : "en"}` as keyof BlogPageSettings;
  return String(settings[key] ?? "");
}

export function createEmptyBlogPost(sortOrder: number): BlogPostRecord {
  const now = new Date().toISOString().slice(0, 10);
  const timestamp = new Date().toISOString();

  return {
    id: `post-${Date.now()}`,
    title_ar: "مقال جديد",
    title_en: "New post",
    excerpt_ar: "",
    excerpt_en: "",
    content_ar: "",
    content_en: "",
    image_url: "/assets/img1.jpeg",
    emoji: "📝",
    date: now,
    read_time: 5,
    active: true,
    sort_order: sortOrder,
    created_at: timestamp,
    updated_at: timestamp,
  };
}
