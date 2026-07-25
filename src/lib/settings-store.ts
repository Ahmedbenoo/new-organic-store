import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { SiteSettings } from "@/lib/types";

const legacySettingsFile = path.join(process.cwd(), "data", "site-settings.json");

export const PUBLIC_SETTING_KEYS = [
  "whatsapp_owner",
  "whatsapp_branch",
  "footer_email",
  "footer_phone",
  "footer_address_en",
  "footer_address_ar",
  "hero_badge_en",
  "hero_badge_ar",
  "hero_title_en",
  "hero_title_ar",
  "hero_description_en",
  "hero_description_ar",
] as const;

const DEFAULT_SETTINGS: SiteSettings = {
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
  admin_password: "admin123",
};

type SettingRow = {
  key: string;
  value: string;
  category: string;
  updated_at?: string;
};

function getClient() {
  return getSupabaseAdminClient();
}

function getSettingCategory(key: string) {
  if (key.startsWith("whatsapp_")) return "contact";
  if (key === "admin_password") return "admin";
  if (key.startsWith("hero_")) return "hero";
  if (key.startsWith("footer_")) return "footer";
  return "general";
}

function settingsToRows(settings: SiteSettings): SettingRow[] {
  const now = new Date().toISOString();

  return Object.entries(settings).map(([key, value]) => ({
    key,
    value: value ?? "",
    category: getSettingCategory(key),
    updated_at: now,
  }));
}

function rowsToSettings(rows: SettingRow[]): SiteSettings {
  const settings: SiteSettings = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return settings;
}

async function loadLegacyJsonSettings() {
  try {
    const raw = await readFile(legacySettingsFile, "utf8");
    return JSON.parse(raw) as SiteSettings;
  } catch {
    return null;
  }
}

async function ensureSeedSettings() {
  const supabase = getClient();
  const { count, error: countError } = await supabase
    .from("site_settings")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to check site_settings table: ${countError.message}`);
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const legacy = await loadLegacyJsonSettings();
  const seed = { ...DEFAULT_SETTINGS, ...legacy };
  const rows = settingsToRows(seed);
  const { error: insertError } = await supabase.from("site_settings").insert(rows);

  if (insertError) {
    throw new Error(`Failed to seed site settings: ${insertError.message}`);
  }
}

export async function readSettings(): Promise<SiteSettings> {
  await ensureSeedSettings();

  const { data, error } = await getClient().from("site_settings").select("key, value");

  if (error) {
    throw new Error(`Failed to read settings: ${error.message}`);
  }

  return rowsToSettings((data ?? []) as SettingRow[]);
}

export async function readPublicSettings() {
  const settings = await readSettings();
  const publicSettings: SiteSettings = {};

  for (const key of PUBLIC_SETTING_KEYS) {
    publicSettings[key] = settings[key] ?? DEFAULT_SETTINGS[key] ?? "";
  }

  return publicSettings;
}

export async function updateSettings(partial: SiteSettings) {
  const current = await readSettings();
  const next = { ...current, ...partial };
  const rows = settingsToRows(
    Object.fromEntries(
      Object.entries(partial).map(([key, value]) => [key, next[key] ?? value ?? ""]),
    ),
  );

  const { error } = await getClient()
    .from("site_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  return next;
}

export async function getAdminPassword() {
  const settings = await readSettings();
  return settings.admin_password ?? DEFAULT_SETTINGS.admin_password ?? "admin123";
}

export async function getWhatsAppNumbers() {
  const settings = await readSettings();

  return {
    owner: settings.whatsapp_owner ?? DEFAULT_SETTINGS.whatsapp_owner ?? "",
    branch: settings.whatsapp_branch ?? DEFAULT_SETTINGS.whatsapp_branch ?? "",
  };
}
