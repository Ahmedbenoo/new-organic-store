import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import {
  deletePartnershipInquiry,
  updatePartnershipInquiryStatus,
} from "@/lib/partnerships-store";
import type { PartnershipInquiryStatus } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const body = (await request.json()) as { status?: PartnershipInquiryStatus };
    const inquiry = await updatePartnershipInquiryStatus(id, body.status ?? "new");

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error("Failed to update partnership inquiry:", error);
    return NextResponse.json(
      { error: "Failed to update inquiry" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const deleted = await deletePartnershipInquiry(id);

    if (!deleted) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete partnership inquiry:", error);
    return NextResponse.json(
      { error: "Failed to delete inquiry" },
      { status: 500 },
    );
  }
}
