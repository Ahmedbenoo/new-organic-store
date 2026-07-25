/**
 * Test about_page singleton via Supabase REST.
 * Run: node scripts/test-about-crud.mjs
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

async function run() {
  console.log("0. Check about_page table...");
  const schemaCheck = await request("/about_page?select=id&limit=1");
  if (!schemaCheck.ok) {
    console.error("SCHEMA CHECK FAILED:", schemaCheck.body);
    console.error("\nApply migration: supabase/migrations/20260725150000_create_about_page_table.sql");
    process.exit(1);
  }
  console.log("   OK");

  console.log("1. Upsert about content...");
  const upsert = await request("/about_page", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: 1,
      content: {
        title_ar: "اختبار",
        title_en: "Test About",
        description_ar: "وصف",
        description_en: "Description",
      },
      updated_at: new Date().toISOString(),
    }),
  });
  if (!upsert.ok) {
    console.error("UPSERT FAILED:", upsert.body);
    process.exit(1);
  }
  console.log("   OK:", upsert.body[0]?.content?.title_en);

  console.log("2. Read about content...");
  const read = await request("/about_page?id=eq.1&select=content,updated_at");
  if (!read.ok || !read.body[0]) {
    console.error("READ FAILED:", read.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("3. Patch about content...");
  const patch = await request("/about_page?id=eq.1", {
    method: "PATCH",
    body: JSON.stringify({
      content: {
        ...read.body[0].content,
        title_en: "Test About Updated",
      },
      updated_at: new Date().toISOString(),
    }),
  });
  if (!patch.ok) {
    console.error("PATCH FAILED:", patch.body);
    process.exit(1);
  }
  console.log("   OK:", patch.body[0]?.content?.title_en);

  console.log("\nAll about page checks passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
