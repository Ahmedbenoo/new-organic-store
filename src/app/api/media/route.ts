import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { listMediaImages, saveUploadedImage } from "@/lib/media-store";

export async function GET() {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const images = await listMediaImages();
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to list media:", error);
    return NextResponse.json(
      { error: "Failed to load images" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be 8MB or smaller" },
        { status: 400 },
      );
    }

    const url = await saveUploadedImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Failed to upload media:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
