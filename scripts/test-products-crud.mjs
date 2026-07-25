/**
 * Test products CRUD via Supabase REST (no supabase-js WebSocket).
 * Run: node scripts/test-products-crud.mjs
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

const testId = `crud-test-${Date.now()}`;

async function run() {
  console.log("0. Check schema (unit, kind, updated_at)...");
  const schemaCheck = await request(
    "/products?select=id,unit,kind,updated_at&limit=1",
  );
  if (!schemaCheck.ok) {
    console.error("SCHEMA CHECK FAILED:", schemaCheck.body);
    console.error(
      "\nApply migration: supabase/migrations/20260725100000_align_products_catalog_model.sql",
    );
    process.exit(1);
  }
  console.log("   OK");

  console.log("1. List products...");
  const list = await request("/products?select=id,name_en&order=sort_order.asc&limit=3");
  if (!list.ok) {
    console.error("LIST FAILED:", list.body);
    process.exit(1);
  }
  console.log("   OK:", list.body.map((p) => p.id).join(", "));

  console.log("2. Create product...");
  const created = await request("/products", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id: testId,
      name_ar: "اختبار",
      name_en: "CRUD Test",
      description_ar: "وصف",
      description_en: "Desc",
      price: 9.99,
      category: "honey",
      emoji: "🍯",
      unit: "fixed",
      kind: "standard",
      image_url: "/assets/honey/default.jpg",
      active: true,
      sort_order: 9999,
    }),
  });
  if (!created.ok) {
    console.error("CREATE FAILED:", created.body);
    process.exit(1);
  }
  console.log("   OK:", created.body[0]?.id);

  console.log("3. Update product...");
  const updated = await request(
    `/products?id=eq.${encodeURIComponent(testId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ name_en: "CRUD Test Updated", price: 12.5 }),
    },
  );
  if (!updated.ok) {
    console.error("UPDATE FAILED:", updated.body);
    process.exit(1);
  }
  console.log("   OK:", updated.body[0]?.name_en);

  console.log("4. Delete product...");
  const deleted = await request(
    `/products?id=eq.${encodeURIComponent(testId)}`,
    { method: "DELETE", headers: { Prefer: "return=representation" } },
  );
  if (!deleted.ok) {
    console.error("DELETE FAILED:", deleted.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("\nAll CRUD checks passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
