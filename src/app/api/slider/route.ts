import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { revalidateSliderPages } from "@/lib/revalidate-storefront";
import { readSlides, replaceSlides } from "@/lib/slider-store";
import type { HeroSlide } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    if (all) {
      const unauthorized = await requireAdminApi();
      if (unauthorized) return unauthorized;
    }

    const slides = await readSlides({ activeOnly: !all });
    return NextResponse.json({ slides });
  } catch (error) {
    console.error("Failed to read slider:", error);
    return NextResponse.json(
      { error: "Failed to load slider" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as { slides?: HeroSlide[] };

    if (!Array.isArray(body.slides)) {
      return NextResponse.json({ error: "Invalid slides payload" }, { status: 400 });
    }

    const slides = await replaceSlides(body.slides);
    revalidateSliderPages();
    return NextResponse.json({ slides });
  } catch (error) {
    console.error("Failed to save slider:", error);
    return NextResponse.json(
      { error: "Failed to save slider" },
      { status: 500 },
    );
  }
}
