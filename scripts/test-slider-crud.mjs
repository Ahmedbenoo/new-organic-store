/**
 * Test hero_slides CRUD via Supabase REST.
 * Run: node scripts/test-slider-crud.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

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

const testId = randomUUID();
const testId2 = randomUUID();

async function run() {
  console.log("0. Check hero_slides table...");
  const schemaCheck = await request("/hero_slides?select=id&limit=1");
  if (!schemaCheck.ok) {
    console.error("SCHEMA CHECK FAILED:", schemaCheck.body);
    console.error("\nApply migration: supabase/migrations/20260725140000_create_hero_slides_table.sql");
    process.exit(1);
  }
  console.log("   OK");

  console.log("1. Create slides...");
  const created = await request("/hero_slides", {
    method: "POST",
    body: JSON.stringify([
      {
        id: testId,
        image_url: "/assets/img1.jpeg",
        label_en: "Slide A",
        label_ar: "شريحة أ",
        active: true,
        sort_order: 1,
      },
      {
        id: testId2,
        image_url: "/assets/img2.jpeg",
        label_en: "Slide B",
        label_ar: "شريحة ب",
        active: true,
        sort_order: 2,
      },
    ]),
  });
  if (!created.ok) {
    console.error("CREATE FAILED:", created.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("2. Update slide...");
  const updated = await request(`/hero_slides?id=eq.${testId}`, {
    method: "PATCH",
    body: JSON.stringify({ label_en: "Slide A Updated", sort_order: 2 }),
  });
  if (!updated.ok) {
    console.error("UPDATE FAILED:", updated.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("3. Delete one slide...");
  const deleted = await request(`/hero_slides?id=eq.${testId2}`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" },
  });
  if (!deleted.ok) {
    console.error("DELETE FAILED:", deleted.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("4. Cleanup...");
  await request(`/hero_slides?id=eq.${testId}`, { method: "DELETE" });
  console.log("   OK");

  console.log("\nAll slider checks passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
