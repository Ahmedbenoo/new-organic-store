import { NextResponse } from "next/server";
import { readBlogData, saveBlogData } from "@/lib/blog-store";
import { requireAdminApi } from "@/lib/api-auth";
import { revalidateBlogPages } from "@/lib/revalidate-storefront";
import type { BlogData } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    if (all) {
      const unauthorized = await requireAdminApi();
      if (unauthorized) return unauthorized;
    }

    const data = await readBlogData({ activeOnly: !all });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to read blog:", error);
    return NextResponse.json({ error: "Failed to load blog" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as Partial<BlogData>;
    const before = await readBlogData();
    const data = await saveBlogData(body);
    const slugs = [
      ...before.posts.map((post) => post.id),
      ...data.posts.map((post) => post.id),
    ];
    revalidateBlogPages(slugs);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to save blog:", error);
    return NextResponse.json({ error: "Failed to save blog" }, { status: 500 });
  }
}
