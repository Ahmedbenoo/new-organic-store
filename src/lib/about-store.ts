import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { AboutPageContent } from "@/lib/types";

const ABOUT_PAGE_ID = 1;

type AboutPageRow = {
  id: number;
  content: AboutPageContent;
  updated_at: string;
};

const EMPTY_ABOUT_CONTENT: AboutPageContent = {
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  story_title_ar: "",
  story_title_en: "",
  story_p1_ar: "",
  story_p1_en: "",
  story_p2_ar: "",
  story_p2_en: "",
  story_image_url: "/assets/img3.jpeg",
  story_emoji: "🐝",
  values_title_ar: "",
  values_title_en: "",
  value1_icon: "🍯",
  value1_title_ar: "",
  value1_title_en: "",
  value1_text_ar: "",
  value1_text_en: "",
  value2_icon: "🤝",
  value2_title_ar: "",
  value2_title_en: "",
  value2_text_ar: "",
  value2_text_en: "",
  value3_icon: "🌍",
  value3_title_ar: "",
  value3_title_en: "",
  value3_text_ar: "",
  value3_text_en: "",
  value4_icon: "✅",
  value4_title_ar: "",
  value4_title_en: "",
  value4_text_ar: "",
  value4_text_en: "",
  process_title_ar: "",
  process_title_en: "",
  step1_title_ar: "",
  step1_title_en: "",
  step1_text_ar: "",
  step1_text_en: "",
  step2_title_ar: "",
  step2_title_en: "",
  step2_text_ar: "",
  step2_text_en: "",
  step3_title_ar: "",
  step3_title_en: "",
  step3_text_ar: "",
  step3_text_en: "",
  updated_at: "",
};

function getClient() {
  return getSupabaseAdminClient();
}

function rowToContent(row: AboutPageRow): AboutPageContent {
  return {
    ...(row.content as AboutPageContent),
    updated_at: row.updated_at,
  };
}

export async function readAboutContent() {
  const { data, error } = await getClient()
    .from("about_page")
    .select("id, content, updated_at")
    .eq("id", ABOUT_PAGE_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read about page: ${error.message}`);
  }

  if (!data) {
    return EMPTY_ABOUT_CONTENT;
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
