import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { CatalogProduct, StoreCategory } from "@/lib/types";

type ProductRow = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  category: string;
  emoji: string;
  unit: string;
  default_quantity: number | null;
  kind: string;
  image_url: string;
  active: boolean;
  on_offer: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function rowToProduct(row: ProductRow): CatalogProduct {
  return {
    id: row.id,
    name_ar: row.name_ar,
    name_en: row.name_en,
    description_ar: row.description_ar,
    description_en: row.description_en,
    price: row.price,
    category: row.category as StoreCategory,
    emoji: row.emoji,
    unit: row.unit as CatalogProduct["unit"],
    defaultQuantity: row.default_quantity ?? undefined,
    kind: row.kind as CatalogProduct["kind"],
    image_url: row.image_url,
    active: row.active,
    on_offer: row.on_offer ?? false,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function productToRow(
  product: Omit<CatalogProduct, "created_at" | "updated_at"> & {
    created_at?: string;
    updated_at?: string;
  },
): ProductRow {
  const now = new Date().toISOString();

  return {
    id: product.id,
    name_ar: product.name_ar,
    name_en: product.name_en,
    description_ar: product.description_ar,
    description_en: product.description_en,
    price: product.price,
    category: product.category,
    emoji: product.emoji,
    unit: product.unit,
    default_quantity: product.defaultQuantity ?? null,
    kind: product.kind,
    image_url: product.image_url,
    active: product.active,
    on_offer: product.on_offer,
    sort_order: product.sort_order,
    created_at: product.created_at ?? now,
    updated_at: product.updated_at ?? now,
  };
}

function patchToRow(
  patch: Partial<Omit<CatalogProduct, "id" | "created_at">>,
): Partial<ProductRow> {
  const row: Partial<ProductRow> = {};

  if (patch.name_ar !== undefined) row.name_ar = patch.name_ar;
  if (patch.name_en !== undefined) row.name_en = patch.name_en;
  if (patch.description_ar !== undefined) row.description_ar = patch.description_ar;
  if (patch.description_en !== undefined) row.description_en = patch.description_en;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.emoji !== undefined) row.emoji = patch.emoji;
  if (patch.unit !== undefined) row.unit = patch.unit;
  if (patch.defaultQuantity !== undefined) {
    row.default_quantity = patch.defaultQuantity ?? null;
  }
  if (patch.kind !== undefined) row.kind = patch.kind;
  if (patch.image_url !== undefined) row.image_url = patch.image_url;
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.on_offer !== undefined) row.on_offer = patch.on_offer;
  if (patch.sort_order !== undefined) row.sort_order = patch.sort_order;
  if (patch.updated_at !== undefined) row.updated_at = patch.updated_at;

  return row;
}

function getClient() {
  return getSupabaseAdminClient();
}

export async function readProducts(options?: {
  activeOnly?: boolean;
}): Promise<CatalogProduct[]> {
  let query = getClient()
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to read products: ${error.message}`);
  }

  return ((data ?? []) as ProductRow[]).map(rowToProduct);
}

export async function readProductById(id: string) {
  const { data, error } = await getClient()
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read product: ${error.message}`);
  }

  return data ? rowToProduct(data as ProductRow) : null;
}

export async function createProduct(
  input: Omit<CatalogProduct, "id" | "created_at" | "updated_at">,
) {
  const now = new Date().toISOString();
  const product: CatalogProduct = {
    ...input,
    id: randomUUID(),
    created_at: now,
    updated_at: now,
  };

  const row = productToRow(product);
  const { data, error } = await getClient()
    .from("products")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return rowToProduct(data as ProductRow);
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<CatalogProduct, "id" | "created_at">>,
) {
  const rowPatch = patchToRow({
    ...patch,
    updated_at: new Date().toISOString(),
  });

  const { data, error } = await getClient()
    .from("products")
    .update(rowPatch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  return data ? rowToProduct(data as ProductRow) : null;
}

export async function deleteProduct(id: string) {
  const { data, error } = await getClient()
    .from("products")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

export function getProductLocalizedName(
  product: CatalogProduct,
  locale: string,
) {
  return locale === "ar" ? product.name_ar : product.name_en;
}

export function getProductLocalizedDescription(
  product: CatalogProduct,
  locale: string,
) {
  return locale === "ar" ? product.description_ar : product.description_en;
}

export function isStoreCategory(value: string): value is StoreCategory {
  return value !== "all";
}
