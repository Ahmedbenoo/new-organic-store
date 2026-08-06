import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { PartnershipInquiry, PartnershipInquiryStatus } from "@/lib/types";

type PartnershipInquiryRow = {
  id: string;
  company_name: string;
  company_field: string;
  phone: string;
  address: string;
  inquiry_subject: string;
  inquiry_details: string;
  status: PartnershipInquiryStatus;
  created_at: string;
};

const DATA_FILE = path.join(process.cwd(), "data", "partnership-inquiries.json");

function getClient() {
  return getSupabaseAdminClient();
}

function isMissingTableError(message: string) {
  return (
    message.includes("partnership_inquiries") &&
    (message.includes("Could not find") ||
      message.includes("does not exist") ||
      message.includes("schema cache"))
  );
}

function rowToInquiry(row: PartnershipInquiryRow): PartnershipInquiry {
  return {
    id: row.id,
    company_name: row.company_name,
    company_field: row.company_field,
    phone: row.phone,
    address: row.address,
    inquiry_subject: row.inquiry_subject,
    inquiry_details: row.inquiry_details,
    status: row.status,
    created_at: row.created_at,
  };
}

async function readLocalInquiries(): Promise<PartnershipInquiry[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as PartnershipInquiry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalInquiries(inquiries: PartnershipInquiry[]) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(inquiries, null, 2), "utf8");
}

export async function readPartnershipInquiries(): Promise<PartnershipInquiry[]> {
  const { data, error } = await getClient()
    .from("partnership_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error.message)) {
      return readLocalInquiries();
    }

    throw new Error(`Failed to read partnership inquiries: ${error.message}`);
  }

  return ((data ?? []) as PartnershipInquiryRow[]).map(rowToInquiry);
}

export async function createPartnershipInquiry(input: {
  company_name: string;
  company_field: string;
  phone: string;
  address: string;
  inquiry_subject: string;
  inquiry_details: string;
}): Promise<PartnershipInquiry> {
  const now = new Date().toISOString();
  const inquiry: PartnershipInquiry = {
    id: randomUUID(),
    company_name: input.company_name.trim(),
    company_field: input.company_field.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    inquiry_subject: input.inquiry_subject.trim(),
    inquiry_details: input.inquiry_details.trim(),
    status: "new",
    created_at: now,
  };

  const { data, error } = await getClient()
    .from("partnership_inquiries")
    .insert({
      id: inquiry.id,
      company_name: inquiry.company_name,
      company_field: inquiry.company_field,
      phone: inquiry.phone,
      address: inquiry.address,
      inquiry_subject: inquiry.inquiry_subject,
      inquiry_details: inquiry.inquiry_details,
      status: inquiry.status,
      created_at: inquiry.created_at,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      const inquiries = await readLocalInquiries();
      inquiries.unshift(inquiry);
      await writeLocalInquiries(inquiries);
      return inquiry;
    }

    throw new Error(`Failed to create partnership inquiry: ${error.message}`);
  }

  return rowToInquiry(data as PartnershipInquiryRow);
}

export async function updatePartnershipInquiryStatus(
  id: string,
  status: PartnershipInquiryStatus,
) {
  const { data, error } = await getClient()
    .from("partnership_inquiries")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      const inquiries = await readLocalInquiries();
      const index = inquiries.findIndex((inquiry) => inquiry.id === id);

      if (index === -1) return null;

      inquiries[index] = { ...inquiries[index], status };
      await writeLocalInquiries(inquiries);
      return inquiries[index];
    }

    throw new Error(`Failed to update partnership inquiry: ${error.message}`);
  }

  return data ? rowToInquiry(data as PartnershipInquiryRow) : null;
}

export async function deletePartnershipInquiry(id: string) {
  const { data, error } = await getClient()
    .from("partnership_inquiries")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    if (isMissingTableError(error.message)) {
      const inquiries = await readLocalInquiries();
      const next = inquiries.filter((inquiry) => inquiry.id !== id);

      if (next.length === inquiries.length) return false;

      await writeLocalInquiries(next);
      return true;
    }

    throw new Error(`Failed to delete partnership inquiry: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}
