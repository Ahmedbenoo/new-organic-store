/**
 * Verify RLS blocks anon writes on protected tables.
 * Run: node scripts/test-rls.mjs
 *
 * Uses NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY only.
 * All write attempts should FAIL if RLS is hardened correctly.
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
loadEnvFile(resolve(process.cwd(), ".env"));

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!baseUrl || !anonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  process.exit(1);
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Note: SUPABASE_SERVICE_ROLE_KEY is set in env but this script uses anon key only.\n",
  );
}

const restUrl = `${baseUrl}/rest/v1`;
const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
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

function formatBody(body) {
  if (body === null || body === undefined) return "(empty)";
  if (typeof body === "string") return body.slice(0, 200);
  return JSON.stringify(body).slice(0, 300);
}

function printResult(label, result) {
  const blocked = !result.ok;
  const status = blocked ? "BLOCKED" : "ALLOWED";
  console.log(`\n${label}`);
  console.log(`  Result:   ${status}`);
  console.log(`  HTTP:     ${result.status}`);
  console.log(`  Response: ${formatBody(result.body)}`);
  return blocked;
}

async function getSampleProductId() {
  const list = await request("/products?select=id&active=eq.true&limit=1");
  if (list.ok && Array.isArray(list.body) && list.body[0]?.id) {
    return list.body[0].id;
  }
  return "rls-test-product-id";
}

async function run() {
  console.log("RLS write test (anon key only)");
  console.log(`URL: ${baseUrl}`);

  const productId = await getSampleProductId();
  const insertId = `rls-anon-insert-${Date.now()}`;
  const now = new Date().toISOString();

  const tests = [
    {
      label: "1. UPDATE products",
      run: () =>
        request(`/products?id=eq.${encodeURIComponent(productId)}`, {
          method: "PATCH",
          body: JSON.stringify({
            name_en: "RLS anon write test",
            updated_at: now,
          }),
        }),
    },
    {
      label: "2. INSERT products",
      run: () =>
        request("/products", {
          method: "POST",
          body: JSON.stringify({
            id: insertId,
            name_ar: "اختبار RLS",
            name_en: "RLS Test Product",
            description_ar: "",
            description_en: "",
            price: 1,
            category: "natural-honey",
            emoji: "🔒",
            unit: "fixed",
            default_quantity: null,
            kind: "standard",
            image_url: "/assets/img1.jpeg",
            active: false,
            sort_order: 9999,
            created_at: now,
            updated_at: now,
          }),
        }),
    },
    {
      label: "3. DELETE products",
      run: () =>
        request(`/products?id=eq.${encodeURIComponent(productId)}`, {
          method: "DELETE",
        }),
    },
    {
      label: "4. UPDATE site_settings",
      run: () =>
        request("/site_settings?key=eq.footer_email", {
          method: "PATCH",
          body: JSON.stringify({
            value: "rls-test@example.com",
            updated_at: now,
          }),
        }),
    },
  ];

  const results = [];

  for (const test of tests) {
    const result = await test.run();
    const blocked = printResult(test.label, result);
    results.push({ label: test.label, blocked, status: result.status });
  }

  console.log("\n--- Summary ---");
  for (const item of results) {
    console.log(
      `${item.blocked ? "PASS" : "FAIL"}  ${item.label} (HTTP ${item.status})`,
    );
  }

  const allBlocked = results.every((item) => item.blocked);

  if (allBlocked) {
    console.log(
      "\nAll anon write attempts were blocked. RLS hardening looks correct.",
    );
    process.exit(0);
  }

  console.error(
    "\nOne or more anon writes succeeded. Review RLS policies and REVOKE grants.",
  );
  process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
