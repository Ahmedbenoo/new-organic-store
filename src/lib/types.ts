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

export type StoreCategory = Exclude<ProductCategory, "all">;

export type ProductKind = "standard" | "custom" | "announcement";

export type ProductUnit = "fixed" | "perGram";

export type CatalogProduct = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  category: StoreCategory;
  emoji: string;
  unit: ProductUnit;
  defaultQuantity?: number;
  kind: ProductKind;
  image_url: string;
  active: boolean;
  on_offer: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  whatsapp_sent: boolean;
  notes: string;
  created_at: string;
};

export type PartnershipInquiryStatus =
  | "new"
  | "reviewed"
  | "contacted"
  | "closed";

export type PartnershipInquiry = {
  id: string;
  company_name: string;
  company_field: string;
  phone: string;
  address: string;
  inquiry_subject: string;
  inquiry_details: string;
  status: PartnershipInquiryStatus;
  created_at: string;
};

export type SiteSettings = Record<string, string>;

export type HeroSlide = {
  id: string;
  image_url: string;
  label_en: string;
  label_ar: string;
  product_id?: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ShopOffer = {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  image_url: string;
  product_id?: string;
  badge_ar: string;
  badge_en: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AboutPageContent = {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  story_title_ar: string;
  story_title_en: string;
  story_p1_ar: string;
  story_p1_en: string;
  story_p2_ar: string;
  story_p2_en: string;
  story_image_url: string;
  story_emoji: string;
  values_title_ar: string;
  values_title_en: string;
  value1_icon: string;
  value1_title_ar: string;
  value1_title_en: string;
  value1_text_ar: string;
  value1_text_en: string;
  value2_icon: string;
  value2_title_ar: string;
  value2_title_en: string;
  value2_text_ar: string;
  value2_text_en: string;
  value3_icon: string;
  value3_title_ar: string;
  value3_title_en: string;
  value3_text_ar: string;
  value3_text_en: string;
  value4_icon: string;
  value4_title_ar: string;
  value4_title_en: string;
  value4_text_ar: string;
  value4_text_en: string;
  process_title_ar: string;
  process_title_en: string;
  step1_title_ar: string;
  step1_title_en: string;
  step1_text_ar: string;
  step1_text_en: string;
  step2_title_ar: string;
  step2_title_en: string;
  step2_text_ar: string;
  step2_text_en: string;
  step3_title_ar: string;
  step3_title_en: string;
  step3_text_ar: string;
  step3_text_en: string;
  updated_at: string;
};

export type BlogPageSettings = {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
};

export type BlogPostRecord = {
  id: string;
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  content_ar: string;
  content_en: string;
  image_url: string;
  emoji: string;
  date: string;
  read_time: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BlogData = {
  settings: BlogPageSettings;
  posts: BlogPostRecord[];
};
