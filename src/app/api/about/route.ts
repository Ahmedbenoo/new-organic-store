import { NextResponse } from "next/server";
import { readAboutContent, updateAboutContent } from "@/lib/about-store";
import { requireAdminApi } from "@/lib/api-auth";
import type { AboutPageContent } from "@/lib/types";

export async function GET() {
  try {
    const content = await readAboutContent();
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to read about content:", error);
    return NextResponse.json(
      { error: "Failed to load about page content" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as Partial<AboutPageContent>;
    const content = await updateAboutContent(body);
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to save about content:", error);
    return NextResponse.json(
      { error: "Failed to save about page content" },
      { status: 500 },
    );
  }
}
