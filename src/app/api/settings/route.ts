import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import {
  readPublicSettings,
  readSettings,
  updateSettings,
} from "@/lib/settings-store";
import type { SiteSettings } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    if (scope === "admin") {
      const unauthorized = await requireAdminApi();
      if (unauthorized) return unauthorized;

      const settings = await readSettings();
      return NextResponse.json({ settings });
    }

    const settings = await readPublicSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to read settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as SiteSettings;
    const settings = await updateSettings(body);
    const { admin_password, ...safeSettings } = settings;
    void admin_password;
    return NextResponse.json({ settings: safeSettings });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}
