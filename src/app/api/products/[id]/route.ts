import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import {
  deleteProduct,
  readProductById,
  updateProduct,
} from "@/lib/products-store";
import type { CatalogProduct } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const product = await readProductById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to read product:", error);
    return NextResponse.json(
      { error: "Failed to load product" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const body = (await request.json()) as Partial<CatalogProduct>;
    const product = await updateProduct(id, body);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const deleted = await deleteProduct(id);

    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
