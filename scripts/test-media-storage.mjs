/**
 * Test Supabase Storage products bucket.
 * Run: node scripts/test-media-storage.mjs
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

const bucket = "products";
const testName = `test-${Date.now()}.png`;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function run() {
  console.log("1. Upload test image...");
  const upload = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${testName}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "image/png",
      "x-upsert": "false",
    },
    body: png,
  });
  const uploadText = await upload.text();
  if (!upload.ok) {
    console.error("UPLOAD FAILED:", upload.status, uploadText);
    process.exit(1);
  }
  console.log("   OK");

  const publicUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${testName}`;
  console.log("2. Public URL:", publicUrl);

  console.log("3. List bucket...");
  const list = await fetch(`${baseUrl}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefix: "", limit: 10, offset: 0 }),
  });
  const listBody = await list.json();
  if (!list.ok) {
    console.error("LIST FAILED:", listBody);
    process.exit(1);
  }
  console.log("   OK:", listBody.length, "objects");

  console.log("4. Delete test image...");
  const del = await fetch(`${baseUrl}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: [testName] }),
  });
  if (!del.ok) {
    console.error("DELETE FAILED:", del.status, await del.text());
    process.exit(1);
  }
  console.log("   OK");

  console.log("\nStorage checks passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
