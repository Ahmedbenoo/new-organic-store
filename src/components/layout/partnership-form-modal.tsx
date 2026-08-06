"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type PartnershipFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type FormState = {
  company_name: string;
  company_field: string;
  phone: string;
  address: string;
  inquiry_subject: string;
  inquiry_details: string;
};

const EMPTY_FORM: FormState = {
  company_name: "",
  company_field: "",
  phone: "",
  address: "",
  inquiry_subject: "",
  inquiry_details: "",
};

export default function PartnershipFormModal({
  isOpen,
  onClose,
}: PartnershipFormModalProps) {
  const t = useTranslations("PartnershipForm");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setForm(EMPTY_FORM);
    setError("");
    setSuccess(false);
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("submit_failed");
      }

      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch {
      setError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partnership-form-title"
        className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-background shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-dark/10 bg-background px-4 py-4 sm:px-6">
          <h2 id="partnership-form-title" className="text-lg font-bold text-dark">
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted transition hover:bg-secondary/40 hover:text-dark"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {success ? (
            <div className="space-y-4 text-center">
              <p className="text-4xl">✅</p>
              <p className="font-semibold text-dark">{t("successTitle")}</p>
              <p className="text-sm text-muted">{t("successMessage")}</p>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                {t("close")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted">{t("description")}</p>

              <div>
                <label className="mb-1 block text-sm font-medium text-dark">
                  {t("companyName")}
                </label>
                <input
                  type="text"
                  required
                  value={form.company_name}
                  onChange={(event) =>
                    setForm({ ...form, company_name: event.target.value })
                  }
                  className="w-full rounded-xl border border-dark/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-dark">
                  {t("companyField")}
                </label>
                <input
                  type="text"
                  required
                  value={form.company_field}
                  onChange={(event) =>
                    setForm({ ...form, company_field: event.target.value })
                  }
                  className="w-full rounded-xl border border-dark/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-dark">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  className="w-full rounded-xl border border-dark/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-dark">
                  {t("address")}
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(event) =>
                    setForm({ ...form, address: event.target.value })
                  }
                  className="w-full rounded-xl border border-dark/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-dark">
                  {t("inquirySubject")}
                </label>
                <input
                  type="text"
                  required
                  value={form.inquiry_subject}
                  onChange={(event) =>
                    setForm({ ...form, inquiry_subject: event.target.value })
                  }
                  className="w-full rounded-xl border border-dark/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-dark">
                  {t("inquiryDetails")}
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.inquiry_details}
                  onChange={(event) =>
                    setForm({ ...form, inquiry_details: event.target.value })
                  }
                  className="w-full resize-none rounded-xl border border-dark/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              {error ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? t("submitting") : t("submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
