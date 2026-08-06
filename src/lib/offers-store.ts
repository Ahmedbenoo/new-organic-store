import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  createDefaultOffers,
  SHOP_OFFER_IDS,
} from "@/lib/shop-offers-defaults";
import type { ShopOffer } from "@/lib/types";

export { SHOP_OFFER_IDS, createDefaultOffers };

type ShopOfferRow = {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  image_url: string;
  product_id: string | null;
  badge_ar: string;
  badge_en: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function getClient() {
  return getSupabaseAdminClient();
}

function sortOffers(offers: ShopOffer[]) {
  return offers.sort((a, b) => a.sort_order - b.sort_order);
}

function rowToOffer(row: ShopOfferRow): ShopOffer {
  return {
    id: row.id,
    title_ar: row.title_ar,
    title_en: row.title_en,
    description_ar: row.description_ar,
    description_en: row.description_en,
    image_url: row.image_url,
    product_id: row.product_id ?? undefined,
    badge_ar: row.badge_ar,
    badge_en: row.badge_en,
    active: row.active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function offerToRow(offer: ShopOffer): ShopOfferRow {
  return {
    id: offer.id,
    title_ar: offer.title_ar,
    title_en: offer.title_en,
    description_ar: offer.description_ar,
    description_en: offer.description_en,
    image_url: offer.image_url,
    product_id: offer.product_id ?? null,
    badge_ar: offer.badge_ar,
    badge_en: offer.badge_en,
    active: offer.active,
    sort_order: offer.sort_order,
    created_at: offer.created_at,
    updated_at: offer.updated_at,
  };
}

export async function readOffers(options?: { activeOnly?: boolean }) {
  let query = getClient()
    .from("shop_offers")
    .select("*")
    .order("sort_order", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to read offers: ${error.message}`);
  }

  const offers = sortOffers(((data ?? []) as ShopOfferRow[]).map(rowToOffer));

  if (offers.length === 0) {
    return createDefaultOffers();
  }

  return offers;
}

export async function replaceOffers(offers: ShopOffer[]) {
  const now = new Date().toISOString();
  const normalized = sortOffers(
    offers.slice(0, 2).map((offer, index) => ({
      ...offer,
      id: SHOP_OFFER_IDS[index] ?? offer.id,
      sort_order: index + 1,
      updated_at: now,
      created_at: offer.created_at || now,
    })),
  );

  if (normalized.length !== 2) {
    throw new Error("Shop offers must contain exactly 2 items");
  }

  const rows = normalized.map((offer) => offerToRow(offer));
  const { error } = await getClient()
    .from("shop_offers")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    throw new Error(`Failed to save offers: ${error.message}`);
  }

  return normalized;
}
