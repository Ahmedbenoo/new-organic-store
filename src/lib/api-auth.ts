import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function requireAdminApi() {
  const isAdmin = await verifyAdminSession();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
