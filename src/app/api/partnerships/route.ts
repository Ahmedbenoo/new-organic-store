import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import {
  createPartnershipInquiry,
  readPartnershipInquiries,
} from "@/lib/partnerships-store";

export async function GET() {
  try {
    const unauthorized = await requireAdminApi();
    if (unauthorized) return unauthorized;

    const inquiries = await readPartnershipInquiries();
    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("Failed to read partnership inquiries:", error);
    return NextResponse.json(
      { error: "Failed to load partnership inquiries" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      company_name?: string;
      company_field?: string;
      phone?: string;
      address?: string;
      inquiry_subject?: string;
      inquiry_details?: string;
    };

    if (
      !body.company_name?.trim() ||
      !body.company_field?.trim() ||
      !body.phone?.trim() ||
      !body.address?.trim() ||
      !body.inquiry_subject?.trim() ||
      !body.inquiry_details?.trim()
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const inquiry = await createPartnershipInquiry({
      company_name: body.company_name,
      company_field: body.company_field,
      phone: body.phone,
      address: body.address,
      inquiry_subject: body.inquiry_subject,
      inquiry_details: body.inquiry_details,
    });

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    console.error("Failed to create partnership inquiry:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 },
    );
  }
}
