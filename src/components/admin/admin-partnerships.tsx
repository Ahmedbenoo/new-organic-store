"use client";

import { useCallback, useEffect, useState } from "react";
import type { PartnershipInquiry, PartnershipInquiryStatus } from "@/lib/types";
import {
  adminLabels,
  partnershipStatusLabel,
} from "@/lib/admin-labels";

const STATUS_COLORS: Record<PartnershipInquiryStatus, string> = {
  new: "bg-yellow-100 text-yellow-700",
  reviewed: "bg-blue-100 text-blue-700",
  contacted: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function AdminPartnerships() {
  const [inquiries, setInquiries] = useState<PartnershipInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<PartnershipInquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState<PartnershipInquiryStatus | "all">(
    "all",
  );

  const refreshInquiries = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/partnerships");
      const payload = (await response.json()) as {
        inquiries?: PartnershipInquiry[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "فشل تحميل طلبات التعاقد");
      }

      setInquiries(payload.inquiries ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "فشل تحميل طلبات التعاقد";
      setLoadError(message);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshInquiries();
  }, [refreshInquiries]);

  async function updateStatus(
    inquiryId: string,
    status: PartnershipInquiryStatus,
  ) {
    const response = await fetch(`/api/partnerships/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) return;

    setInquiries((prev) =>
      prev.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, status } : inquiry,
      ),
    );

    if (selected?.id === inquiryId) {
      setSelected((prev) => (prev ? { ...prev, status } : prev));
    }
  }

  async function deleteInquiry(inquiryId: string) {
    if (!window.confirm("هل تريد حذف طلب التعاقد هذا؟")) return;

    const response = await fetch(`/api/partnerships/${inquiryId}`, {
      method: "DELETE",
    });

    if (!response.ok) return;

    setInquiries((prev) => prev.filter((inquiry) => inquiry.id !== inquiryId));
    if (selected?.id === inquiryId) setSelected(null);
  }

  const filtered =
    statusFilter === "all"
      ? inquiries
      : inquiries.filter((inquiry) => inquiry.status === statusFilter);

  const stats = {
    total: inquiries.length,
    new: inquiries.filter((inquiry) => inquiry.status === "new").length,
    reviewed: inquiries.filter((inquiry) => inquiry.status === "reviewed").length,
    contacted: inquiries.filter((inquiry) => inquiry.status === "contacted").length,
  };

  const statusFilters: Array<PartnershipInquiryStatus | "all"> = [
    "all",
    "new",
    "reviewed",
    "contacted",
    "closed",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">طلبات التعاقد</h2>
          <p className="text-sm text-gray-500">
            طلبات الشركات المرسلة من نموذج «تعاقد معنا»
          </p>
        </div>
        <button
          type="button"
          onClick={refreshInquiries}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 sm:w-auto"
        >
          {adminLabels.refresh}
        </button>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "الإجمالي", value: stats.total, color: "bg-gray-100 text-gray-700" },
          { label: "جديد", value: stats.new, color: "bg-yellow-100 text-yellow-700" },
          {
            label: "تمت المراجعة",
            value: stats.reviewed,
            color: "bg-blue-100 text-blue-700",
          },
          {
            label: "تم التواصل",
            value: stats.contacted,
            color: "bg-green-100 text-green-700",
          },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl px-4 py-3 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === status
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? adminLabels.all : partnershipStatusLabel(status)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">{adminLabels.loading}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-2xl">🤝</p>
          <p className="mt-2 font-medium text-gray-500">لا توجد طلبات تعاقد بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => (
            <article
              key={inquiry.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-bold text-gray-900">{inquiry.company_name}</p>
                  <p className="text-sm text-gray-500">{inquiry.company_field}</p>
                  <p className="text-sm text-gray-600" dir="ltr">
                    {inquiry.phone}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                    STATUS_COLORS[inquiry.status]
                  }`}
                >
                  {partnershipStatusLabel(inquiry.status)}
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-gray-800">
                {inquiry.inquiry_subject}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                {inquiry.inquiry_details}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(inquiry)}
                  className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  عرض التفاصيل
                </button>
                <button
                  type="button"
                  onClick={() => void deleteInquiry(inquiry.id)}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  {adminLabels.delete}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
              <h3 className="text-lg font-bold text-gray-900">تفاصيل طلب التعاقد</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label={adminLabels.close}
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-gray-500">اسم الشركة</p>
                  <p className="font-semibold text-gray-900">{selected.company_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">مجال الشركة</p>
                  <p className="font-semibold text-gray-900">{selected.company_field}</p>
                </div>
                <div>
                  <p className="text-gray-500">رقم التليفون</p>
                  <p className="font-semibold text-gray-900" dir="ltr">
                    {selected.phone}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500">عنوان المؤسسة</p>
                  <p className="font-semibold text-gray-900">{selected.address}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500">موضوع الاستفسار</p>
                  <p className="font-semibold text-gray-900">{selected.inquiry_subject}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-500">تفاصيل الاستفسار</p>
                  <p className="font-semibold text-gray-900 whitespace-pre-wrap">
                    {selected.inquiry_details}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">تحديث الحالة</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["new", "reviewed", "contacted", "closed"] as PartnershipInquiryStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateStatus(selected.id, status)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        selected.status === status
                          ? STATUS_COLORS[status]
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {partnershipStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400">
                تاريخ الإرسال:{" "}
                {new Date(selected.created_at).toLocaleString("ar-EG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
