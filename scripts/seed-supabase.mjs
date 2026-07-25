/**
 * Seed Supabase from local JSON / message files.
 * Run once after migrations: npm run seed
 *
 * Idempotent: skips tables that already have rows (uses upsert where needed).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";

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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const restUrl = `${baseUrl}/rest/v1`;
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

function readJson(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  if (!existsSync(absolutePath)) return null;
  return JSON.parse(readFileSync(absolutePath, "utf8"));
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

async function hasRows(table, filter = "") {
  const query = filter ? `/${table}?${filter}&limit=1` : `/${table}?select=id&limit=1`;
  const result = await request(query);
  if (!result.ok) {
    throw new Error(`Failed to check ${table}: ${JSON.stringify(result.body)}`);
  }
  return Array.isArray(result.body) && result.body.length > 0;
}

const DEFAULT_SETTINGS = {
  whatsapp_owner: "201092313486",
  whatsapp_branch: "201092313486",
  footer_email: "hello@organic-store.com",
  footer_phone: "01092313486",
  footer_address_en: "Cairo, Egypt",
  footer_address_ar: "القاهرة، مصر",
  hero_badge_en: "100% Organic",
  hero_badge_ar: "عضوي 100%",
  hero_title_en: "Nature's sweetest gift, bottled with care.",
  hero_title_ar: "أحلى هدية من الطبيعة، معبأة بعناية.",
  hero_description_en:
    "Discover raw honey, wildflower varieties, and small-batch blends from apiaries we know and trust.",
  hero_description_ar:
    "اكتشف العسل الخام وأصناف الزهور البرية والخلطات الصغيرة من مناحل نعرفها ونثق بها.",
};

function hashAdminPassword(plain) {
  return bcrypt.hashSync(plain, 12);
}

function resolveAdminPasswordHash(settings) {
  const configured = settings.admin_password?.trim();
  const initialPassword =
    process.env.ADMIN_INITIAL_PASSWORD?.trim() || "admin123";
  const plainPassword =
    configured && !/^\$2[aby]\$\d{2}\$/.test(configured)
      ? configured
      : initialPassword;

  return hashAdminPassword(plainPassword);
}

function getSettingCategory(settingKey) {
  if (settingKey.startsWith("whatsapp_")) return "contact";
  if (settingKey === "admin_password") return "admin";
  if (settingKey.startsWith("hero_")) return "hero";
  if (settingKey.startsWith("footer_")) return "footer";
  return "general";
}

function settingsToRows(settings) {
  const now = new Date().toISOString();
  return Object.entries(settings).map(([settingKey, value]) => ({
    key: settingKey,
    value: value ?? "",
    category: getSettingCategory(settingKey),
    updated_at: now,
  }));
}

function normalizeProductRow(product) {
  const now = new Date().toISOString();
  return {
    id: product.id,
    name_ar: product.name_ar,
    name_en: product.name_en,
    description_ar: product.description_ar ?? "",
    description_en: product.description_en ?? "",
    price: product.price,
    category: product.category,
    emoji: product.emoji ?? "🍯",
    unit: product.unit ?? "fixed",
    default_quantity: product.default_quantity ?? product.defaultQuantity ?? null,
    kind: product.kind ?? "standard",
    image_url: product.image_url ?? "/assets/img1.jpeg",
    active: product.active ?? true,
    sort_order: product.sort_order ?? 999,
    created_at: product.created_at ?? now,
    updated_at: product.updated_at ?? now,
  };
}

function buildProductsFromMessages() {
  const ar = readJson("messages/ar.json");
  const en = readJson("messages/en.json");
  const meta = readJson("scripts/seed-data/products.json");

  if (!ar || !en || !Array.isArray(meta)) {
    return null;
  }

  const now = new Date().toISOString();

  return meta.map((product, index) =>
    normalizeProductRow({
      ...product,
      name_ar: ar.Products?.items?.[product.id]?.name ?? product.id,
      name_en: en.Products?.items?.[product.id]?.name ?? product.id,
      description_ar: ar.Products?.items?.[product.id]?.description ?? "",
      description_en: en.Products?.items?.[product.id]?.description ?? "",
      sort_order: product.sort_order ?? index + 1,
      created_at: now,
      updated_at: now,
    }),
  );
}

function loadProductSeedRows() {
  const fromData = readJson("data/products.json");
  if (Array.isArray(fromData) && fromData.length > 0) {
    return fromData.map(normalizeProductRow);
  }

  const fromScriptData = readJson("scripts/seed-data/products.json");
  if (Array.isArray(fromScriptData) && fromScriptData.length > 0) {
    const hasLocalizedNames = fromScriptData.some((row) => row.name_ar && row.name_en);
    if (hasLocalizedNames) {
      return fromScriptData.map(normalizeProductRow);
    }
    return buildProductsFromMessages();
  }

  return buildProductsFromMessages();
}

async function seedProducts() {
  if (await hasRows("products")) {
    console.log("products: already seeded, skipping");
    return;
  }

  const rows = loadProductSeedRows();
  if (!rows?.length) {
    console.warn("products: no seed data found, skipping");
    return;
  }

  const result = await request("/products", {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });

  if (!result.ok) {
    throw new Error(`products seed failed: ${JSON.stringify(result.body)}`);
  }

  console.log(`products: seeded ${rows.length} rows`);
}

async function seedSettings() {
  if (await hasRows("site_settings")) {
    console.log("site_settings: already seeded, skipping");
    return;
  }

  const legacy = readJson("data/site-settings.json");
  const seed = { ...DEFAULT_SETTINGS, ...(legacy ?? {}) };
  seed.admin_password = resolveAdminPasswordHash(seed);
  const rows = settingsToRows(seed);

  const result = await request("/site_settings", {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });

  if (!result.ok) {
    throw new Error(`site_settings seed failed: ${JSON.stringify(result.body)}`);
  }

  console.log(`site_settings: seeded ${rows.length} rows`);
}

async function seedOrders() {
  if (await hasRows("orders")) {
    console.log("orders: already seeded, skipping");
    return;
  }

  const orders = readJson("data/orders.json");
  if (!Array.isArray(orders) || orders.length === 0) {
    console.log("orders: no seed data, skipping");
    return;
  }

  const result = await request("/orders", {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(orders),
  });

  if (!result.ok) {
    throw new Error(`orders seed failed: ${JSON.stringify(result.body)}`);
  }

  console.log(`orders: seeded ${orders.length} rows`);
}

async function seedSlides() {
  if (await hasRows("hero_slides")) {
    console.log("hero_slides: already seeded, skipping");
    return;
  }

  const slides = readJson("data/hero-slider.json");
  if (!Array.isArray(slides) || slides.length === 0) {
    console.log("hero_slides: no seed data, skipping");
    return;
  }

  const rows = slides.map((slide) => ({
    ...slide,
    product_id: slide.product_id ?? null,
  }));

  const result = await request("/hero_slides", {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!result.ok) {
    throw new Error(`hero_slides seed failed: ${JSON.stringify(result.body)}`);
  }

  console.log(`hero_slides: seeded ${rows.length} rows`);
}

async function seedAbout() {
  if (await hasRows("about_page", "select=id&id=eq.1")) {
    console.log("about_page: already seeded, skipping");
    return;
  }

  const content = readJson("data/about-page.json");
  if (!content) {
    console.log("about_page: no seed data, skipping");
    return;
  }

  const now = new Date().toISOString();
  const result = await request("/about_page", {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify([
      {
        id: 1,
        content: { ...content, updated_at: content.updated_at ?? now },
        updated_at: content.updated_at ?? now,
      },
    ]),
  });

  if (!result.ok) {
    throw new Error(`about_page seed failed: ${JSON.stringify(result.body)}`);
  }

  console.log("about_page: seeded");
}

async function seedBlog() {
  const legacy = readJson("data/blog.json");
  if (!legacy) {
    console.log("blog: no seed data, skipping");
    return;
  }

  const hasSettings = await hasRows("blog_page_settings", "select=id&id=eq.1");
  const hasPosts = await hasRows("blog_posts");

  if (hasSettings && hasPosts) {
    console.log("blog: already seeded, skipping");
    return;
  }

  const now = new Date().toISOString();

  if (!hasSettings && legacy.settings) {
    const result = await request("/blog_page_settings", {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify([
        {
          id: 1,
          ...legacy.settings,
          updated_at: now,
        },
      ]),
    });

    if (!result.ok) {
      throw new Error(
        `blog_page_settings seed failed: ${JSON.stringify(result.body)}`,
      );
    }

    console.log("blog_page_settings: seeded");
  }

  if (!hasPosts && Array.isArray(legacy.posts) && legacy.posts.length > 0) {
    const result = await request("/blog_posts", {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(legacy.posts),
    });

    if (!result.ok) {
      throw new Error(`blog_posts seed failed: ${JSON.stringify(result.body)}`);
    }

    console.log(`blog_posts: seeded ${legacy.posts.length} rows`);
  }
}

async function run() {
  console.log("Seeding Supabase...\n");

  await seedProducts();
  await seedSettings();
  await seedOrders();
  await seedSlides();
  await seedAbout();
  await seedBlog();

  console.log("\nSeed complete.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
