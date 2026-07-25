import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { HeroSlide } from "@/lib/types";

const legacySliderFile = path.join(process.cwd(), "data", "hero-slider.json");

type HeroSlideRow = {
  id: string;
  image_url: string;
  label_en: string;
  label_ar: string;
  product_id: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function getClient() {
  return getSupabaseAdminClient();
}

function sortSlides(slides: HeroSlide[]) {
  return slides.sort((a, b) => a.sort_order - b.sort_order);
}

function rowToSlide(row: HeroSlideRow): HeroSlide {
  return {
    id: row.id,
    image_url: row.image_url,
    label_en: row.label_en,
    label_ar: row.label_ar,
    product_id: row.product_id ?? undefined,
    active: row.active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function slideToRow(slide: HeroSlide): HeroSlideRow {
  return {
    id: slide.id,
    image_url: slide.image_url,
    label_en: slide.label_en,
    label_ar: slide.label_ar,
    product_id: slide.product_id ?? null,
    active: slide.active,
    sort_order: slide.sort_order,
    created_at: slide.created_at,
    updated_at: slide.updated_at,
  };
}

async function loadLegacyJsonSlides() {
  try {
    const raw = await readFile(legacySliderFile, "utf8");
    const parsed = JSON.parse(raw) as HeroSlide[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function ensureSeedSlides() {
  const supabase = getClient();
  const { count, error: countError } = await supabase
    .from("hero_slides")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to check hero_slides table: ${countError.message}`);
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const legacy = await loadLegacyJsonSlides();
  if (legacy.length === 0) {
    return;
  }

  const rows = sortSlides(legacy).map((slide) => slideToRow(slide));
  const { error: insertError } = await supabase
    .from("hero_slides")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });

  if (insertError) {
    throw new Error(`Failed to seed hero slides: ${insertError.message}`);
  }
}

export async function readSlides(options?: { activeOnly?: boolean }) {
  await ensureSeedSlides();

  let query = getClient()
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to read slides: ${error.message}`);
  }

  return sortSlides(((data ?? []) as HeroSlideRow[]).map(rowToSlide));
}

export async function replaceSlides(slides: HeroSlide[]) {
  const now = new Date().toISOString();
  const normalized = sortSlides(
    slides.map((slide, index) => ({
      ...slide,
      sort_order: index + 1,
      updated_at: now,
      created_at: slide.created_at || now,
    })),
  );

  const supabase = getClient();
  const { data: existing, error: existingError } = await supabase
    .from("hero_slides")
    .select("id");

  if (existingError) {
    throw new Error(`Failed to read existing slides: ${existingError.message}`);
  }

  const nextIds = new Set(normalized.map((slide) => slide.id));
  const idsToDelete = (existing ?? [])
    .map((row) => row.id as string)
    .filter((id) => !nextIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("hero_slides")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      throw new Error(`Failed to delete removed slides: ${deleteError.message}`);
    }
  }

  if (normalized.length > 0) {
    const rows = normalized.map((slide) => slideToRow(slide));
    const { error: upsertError } = await supabase
      .from("hero_slides")
      .upsert(rows, { onConflict: "id" });

    if (upsertError) {
      throw new Error(`Failed to save slides: ${upsertError.message}`);
    }
  }

  return normalized;
}

export function createEmptySlide(sortOrder: number): HeroSlide {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    image_url: "/assets/img1.jpeg",
    label_en: "New slide",
    label_ar: "شريحة جديدة",
    active: true,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  };
}
