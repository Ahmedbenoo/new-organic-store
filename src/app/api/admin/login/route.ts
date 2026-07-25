import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/admin-auth";
import { getAdminPassword } from "@/lib/settings-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim() ?? "";
    const expected = await getAdminPassword();

    if (!password || password !== expected) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await setAdminSession(password);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
