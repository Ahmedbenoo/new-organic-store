import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { createProduct, readProducts } from "@/lib/products-store";
import { revalidateProductPages } from "@/lib/revalidate-storefront";
import type { CatalogProduct } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "true";

    if (includeInactive) {
      const unauthorized = await requireAdminApi();
      if (unauthorized) return unauthorized;
    }

    const products = await readProducts({ activeOnly: !includeInactive });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to read products:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as Partial<CatalogProduct>;

    if (
      !body.name_ar ||
      !body.name_en ||
      !body.category ||
      body.price === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required product fields" },
        { status: 400 },
      );
    }

    const product = await createProduct({
      name_ar: body.name_ar,
      name_en: body.name_en,
      description_ar: body.description_ar ?? "",
      description_en: body.description_en ?? "",
      price: body.price,
      category: body.category,
      emoji: body.emoji ?? "🍯",
      unit: body.unit ?? "fixed",
      defaultQuantity: body.defaultQuantity,
      kind: body.kind ?? "standard",
      image_url: body.image_url ?? "/assets/img1.jpeg",
      active: body.active ?? true,
      sort_order: body.sort_order ?? 999,
    });

    revalidateProductPages();
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
