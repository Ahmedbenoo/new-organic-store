/**
 * Test orders CRUD via Supabase REST.
 * Run: node scripts/test-orders-crud.mjs
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

async function run() {
  console.log("1. List orders...");
  const list = await request("/orders?select=id,status&order=created_at.desc&limit=3");
  if (!list.ok) {
    console.error("LIST FAILED:", list.body);
    process.exit(1);
  }
  console.log(`   OK (${list.body.length} shown)`);

  console.log("2. Create order...");
  const created = await request("/orders", {
    method: "POST",
    body: JSON.stringify({
      id: testId,
      customer_name: "Test Customer",
      customer_phone: "01092313486",
      customer_address: "Cairo",
      items: [{ productId: "clover-blossom", name: "Test", price: 100, quantity: 1 }],
      total: 100,
      status: "pending",
      whatsapp_sent: false,
      notes: "CRUD test",
    }),
  });
  if (!created.ok) {
    console.error("CREATE FAILED:", created.body);
    process.exit(1);
  }
  console.log("   OK:", created.body[0]?.id);

  console.log("3. Update order status...");
  const updated = await request(`/orders?id=eq.${testId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "confirmed" }),
  });
  if (!updated.ok) {
    console.error("UPDATE FAILED:", updated.body);
    process.exit(1);
  }
  console.log("   OK:", updated.body[0]?.status);

  console.log("4. Delete order...");
  const deleted = await request(`/orders?id=eq.${testId}`, {
    method: "DELETE",
    headers: { Prefer: "return=representation" },
  });
  if (!deleted.ok) {
    console.error("DELETE FAILED:", deleted.body);
    process.exit(1);
  }
  console.log("   OK");

  console.log("\nAll orders checks passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
