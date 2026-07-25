export const productCategories = [
  "all",
  "natural-honey",
  "sidr",
  "bee-products",
  "mixed-honey",
  "formulations",
  "vip-formulations",
  "natural-oils",
  "dates",
] as const;

export type ProductCategory = (typeof productCategories)[number];

export type ProductKind = "standard" | "custom" | "announcement";

export type ProductUnit = "fixed" | "perGram";

export type Product = {
  id: string;
  price: number;
  category: Exclude<ProductCategory, "all">;
  emoji: string;
  unit: ProductUnit;
  defaultQuantity?: number;
  kind: ProductKind;
};

export const products: Product[] = [
  // 1. Natural bee honey
  {
    id: "clover-blossom",
    price: 210,
    category: "natural-honey",
    emoji: "🌼",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "citrus-blossom",
    price: 250,
    category: "natural-honey",
    emoji: "🍊",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "black-seed-honey",
    price: 260,
    category: "natural-honey",
    emoji: "🌿",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "sage-honey",
    price: 260,
    category: "natural-honey",
    emoji: "🍃",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "wild-herbs-honey",
    price: 250,
    category: "natural-honey",
    emoji: "🌾",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "nuts-honey",
    price: 200,
    category: "natural-honey",
    emoji: "🥜",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "citrus-wax",
    price: 275,
    category: "natural-honey",
    emoji: "🍯",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "clover-wax",
    price: 250,
    category: "natural-honey",
    emoji: "🐝",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "fennel-honey",
    price: 280,
    category: "natural-honey",
    emoji: "🌱",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "acacia-sunt",
    price: 270,
    category: "natural-honey",
    emoji: "🌳",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "anise-honey",
    price: 270,
    category: "natural-honey",
    emoji: "⭐",
    unit: "fixed",
    kind: "standard",
  },

  // 2. Sidr honey
  {
    id: "sidr-egyptian",
    price: 880,
    category: "sidr",
    emoji: "🏔️",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "sidr-kashmiri",
    price: 1570,
    category: "sidr",
    emoji: "🌄",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "sidr-hadhrami",
    price: 1890,
    category: "sidr",
    emoji: "🕌",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "sidr-saudi",
    price: 1680,
    category: "sidr",
    emoji: "🇸🇦",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "white-russian",
    price: 1999,
    category: "sidr",
    emoji: "❄️",
    unit: "fixed",
    kind: "standard",
  },

  // 3. Bee products (per gram)
  {
    id: "royal-jelly",
    price: 20,
    category: "bee-products",
    emoji: "👑",
    unit: "perGram",
    defaultQuantity: 50,
    kind: "standard",
  },
  {
    id: "bee-pollen",
    price: 5,
    category: "bee-products",
    emoji: "🌻",
    unit: "perGram",
    defaultQuantity: 100,
    kind: "standard",
  },
  {
    id: "palm-pollen",
    price: 5,
    category: "bee-products",
    emoji: "🌴",
    unit: "perGram",
    defaultQuantity: 100,
    kind: "standard",
  },
  {
    id: "red-ginseng",
    price: 8,
    category: "bee-products",
    emoji: "🫚",
    unit: "perGram",
    defaultQuantity: 50,
    kind: "standard",
  },
  {
    id: "propolis",
    price: 10,
    category: "bee-products",
    emoji: "💛",
    unit: "perGram",
    defaultQuantity: 50,
    kind: "standard",
  },

  // 4. Mixed honey
  {
    id: "ginseng-honey",
    price: 870,
    category: "mixed-honey",
    emoji: "🍯",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "royal-honey-blend",
    price: 1880,
    category: "mixed-honey",
    emoji: "✨",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "propolis-honey",
    price: 890,
    category: "mixed-honey",
    emoji: "🛡️",
    unit: "fixed",
    kind: "standard",
  },
  {
    id: "squeeze-honey",
    price: 250,
    category: "mixed-honey",
    emoji: "🧴",
    unit: "fixed",
    kind: "standard",
  },

  // 5. Custom formulations
  {
    id: "custom-formulation",
    price: 0,
    category: "formulations",
    emoji: "⚗️",
    unit: "fixed",
    kind: "custom",
  },

  // 6. VIP formulations
  {
    id: "vip-formulation",
    price: 0,
    category: "vip-formulations",
    emoji: "💎",
    unit: "fixed",
    kind: "custom",
  },

  // 7. Natural oils & rural products
  {
    id: "rural-products",
    price: 0,
    category: "natural-oils",
    emoji: "🫒",
    unit: "fixed",
    kind: "announcement",
  },

  // 8. Dates (coming soon)
  {
    id: "madinah-dates",
    price: 0,
    category: "dates",
    emoji: "🌴",
    unit: "fixed",
    kind: "announcement",
  },
  {
    id: "qassim-dates",
    price: 0,
    category: "dates",
    emoji: "🌴",
    unit: "fixed",
    kind: "announcement",
  },
  {
    id: "majdoul-dates",
    price: 0,
    category: "dates",
    emoji: "🌴",
    unit: "fixed",
    kind: "announcement",
  },
  {
    id: "ajwa-dates",
    price: 0,
    category: "dates",
    emoji: "🌴",
    unit: "fixed",
    kind: "announcement",
  },
  {
    id: "sukkari-dates",
    price: 0,
    category: "dates",
    emoji: "🌴",
    unit: "fixed",
    kind: "announcement",
  },
];

export function getProductsByCategory(category: Exclude<ProductCategory, "all">) {
  return products.filter((product) => product.category === category);
}
