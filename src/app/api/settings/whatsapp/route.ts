import { NextResponse } from "next/server";
import { getWhatsAppNumbers } from "@/lib/settings-store";

export async function GET() {
  return NextResponse.json(await getWhatsAppNumbers());
}
