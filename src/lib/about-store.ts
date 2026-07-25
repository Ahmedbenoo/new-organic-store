import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { AboutPageContent } from "@/lib/types";

const ABOUT_PAGE_ID = 1;
const legacyAboutFile = path.join(process.cwd(), "data", "about-page.json");

type AboutPageRow = {
  id: number;
  content: AboutPageContent;
  updated_at: string;
};

function getClient() {
  return getSupabaseAdminClient();
}

async function loadLegacyJsonAbout() {
  try {
    const raw = await readFile(legacyAboutFile, "utf8");
    return JSON.parse(raw) as AboutPageContent;
  } catch {
    return null;
  }
}

async function ensureSeedAbout() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("about_page")
    .select("id")
    .eq("id", ABOUT_PAGE_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check about_page table: ${error.message}`);
  }

  if (data) {
    return;
  }

  const legacy = await loadLegacyJsonAbout();
  if (!legacy) {
    return;
  }

  const now = new Date().toISOString();
  const content: AboutPageContent = {
    ...legacy,
    updated_at: legacy.updated_at ?? now,
  };

  const { error: insertError } = await supabase.from("about_page").insert({
    id: ABOUT_PAGE_ID,
    content,
    updated_at: content.updated_at,
  });

  if (insertError) {
    throw new Error(`Failed to seed about page: ${insertError.message}`);
  }
}

function rowToContent(row: AboutPageRow): AboutPageContent {
  return {
    ...(row.content as AboutPageContent),
    updated_at: row.updated_at,
  };
}

export async function readAboutContent() {
  await ensureSeedAbout();

  const { data, error } = await getClient()
    .from("about_page")
    .select("id, content, updated_at")
    .eq("id", ABOUT_PAGE_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read about page: ${error.message}`);
  }

  if (!data) {
    const legacy = await loadLegacyJsonAbout();
    if (legacy) {
      return legacy;
    }

    throw new Error("About page content is not available.");
  }

  return rowToContent(data as AboutPageRow);
}

export async function updateAboutContent(partial: Partial<AboutPageContent>) {
  const current = await readAboutContent();
  const next: AboutPageContent = {
    ...current,
    ...partial,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await getClient()
    .from("about_page")
    .upsert(
      {
        id: ABOUT_PAGE_ID,
        content: next,
        updated_at: next.updated_at,
      },
      { onConflict: "id" },
    )
    .select("id, content, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to update about page: ${error.message}`);
  }

  return rowToContent(data as AboutPageRow);
}

export function getAboutLocalizedField(
  content: AboutPageContent,
  baseKey: string,
  locale: string,
) {
  const key = `${baseKey}_${locale === "ar" ? "ar" : "en"}` as keyof AboutPageContent;
  return String(content[key] ?? "");
}
