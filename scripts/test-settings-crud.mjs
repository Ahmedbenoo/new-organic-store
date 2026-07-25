/**
 * Test site_settings CRUD via Supabase REST.
 * Run: node scripts/test-settings-crud.mjs
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
  console.log("1. List settings...");
  const list = await request("/site_settings?select=key,value&order=key.asc");
  if (!list.ok) {
    console.error("LIST FAILED:", list.body);
    process.exit(1);
  }
  console.log(`   OK (${list.body.length} rows)`);

  console.log("2. Upsert test setting...");
  const upsert = await request("/site_settings", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      key: "footer_email",
      value: "test@organic-store.com",
      category: "footer",
    }),
  });
  if (!upsert.ok) {
    console.error("UPSERT FAILED:", upsert.body);
    process.exit(1);
  }
  console.log("   OK:", upsert.body[0]?.value);

  console.log("3. Restore footer_email...");
  const restore = await request("/site_settings?key=eq.footer_email", {
    method: "PATCH",
    body: JSON.stringify({ value: "hello@organic-store.com" }),
  });
  if (!restore.ok) {
    console.error("RESTORE FAILED:", restore.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("\nAll settings checks passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
