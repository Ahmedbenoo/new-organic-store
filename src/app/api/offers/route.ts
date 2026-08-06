import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { readOffers, replaceOffers } from "@/lib/offers-store";
import { createDefaultOffers } from "@/lib/shop-offers-defaults";
import { revalidateOffersPages } from "@/lib/revalidate-storefront";
import type { ShopOffer } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    if (all) {
      const unauthorized = await requireAdminApi();
      if (unauthorized) return unauthorized;
    }

    const offers = await readOffers({ activeOnly: !all });
    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Failed to read offers:", error);

    const { searchParams } = new URL(request.url);
    if (searchParams.get("all") !== "true") {
      return NextResponse.json({ offers: createDefaultOffers() });
    }

    return NextResponse.json(
      { error: "Failed to load offers" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as { offers?: ShopOffer[] };

    if (!Array.isArray(body.offers)) {
      return NextResponse.json({ error: "Invalid offers payload" }, { status: 400 });
    }

    const offers = await replaceOffers(body.offers);
    revalidateOffersPages();
    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Failed to save offers:", error);
    return NextResponse.json(
      { error: "Failed to save offers" },
      { status: 500 },
    );
  }
}
