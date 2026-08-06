import type { ShopOffer } from "@/lib/types";

export const SHOP_OFFER_IDS = ["shop-offer-1", "shop-offer-2"] as const;

export function createDefaultOffers(): ShopOffer[] {
  const now = new Date().toISOString();

  return [
    {
      id: "shop-offer-1",
      title_ar: "عرض عسل الزهور",
      title_en: "Blossom Honey Offer",
      description_ar: "خصم على عسل الزهور الطبيعي — جودة عضوية 100%",
      description_en: "Save on natural blossom honey — 100% organic quality",
      image_url: "/assets/img1.jpeg",
      product_id: "clover-blossom",
      badge_ar: "خصم 15%",
      badge_en: "15% OFF",
      active: true,
      sort_order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: "shop-offer-2",
      title_ar: "عرض عسل السدر",
      title_en: "Sidr Honey Offer",
      description_ar: "عرض محدود على عسل السدر المصري الأصلي",
      description_en: "Limited offer on authentic Egyptian Sidr honey",
      image_url: "/assets/img1.jpeg",
      product_id: "sidr-egyptian",
      badge_ar: "عرض محدود",
      badge_en: "Limited",
      active: true,
      sort_order: 2,
      created_at: now,
      updated_at: now,
    },
  ];
}
