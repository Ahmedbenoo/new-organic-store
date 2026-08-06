"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import PartnershipFormModal from "@/components/layout/partnership-form-modal";
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from "@/lib/whatsapp";

const DEFAULT_WHATSAPP_OWNER = "201092313486";

function PartnershipIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0 fill-none stroke-current stroke-[1.75] sm:size-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
      />
      <circle cx="9" cy="7" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      />
    </svg>
  );
}

function OffersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0 fill-none stroke-current stroke-[1.75] sm:size-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
      />
      <circle cx="7" cy="7" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-7 fill-current"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const floatButtonClassName =
  "flex size-14 items-center justify-center rounded-full shadow-lg transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export default function FloatingActions() {
  const t = useTranslations("Common");
  const locale = useLocale();
  const [whatsappOwner, setWhatsappOwner] = useState(DEFAULT_WHATSAPP_OWNER);
  const [partnershipOpen, setPartnershipOpen] = useState(false);

  useEffect(() => {
    void fetch("/api/settings/whatsapp")
      .then((response) => response.json())
      .then((payload: { owner?: string }) => {
        if (payload.owner) setWhatsappOwner(payload.owner);
      })
      .catch(() => undefined);
  }, []);

  const whatsappUrl = useMemo(() => {
    const message =
      locale === "ar"
        ? "مرحباً، أود التواصل مع Organic Store 🍯"
        : "Hello, I would like to contact Organic Store 🍯";

    return buildWhatsAppUrl(
      normalizeWhatsAppNumber(whatsappOwner),
      encodeURIComponent(message),
    );
  }, [locale, whatsappOwner]);

  return (
    <>
      <div className="fixed bottom-5 left-5 z-40 flex flex-col gap-3 sm:bottom-6 sm:left-6">
        <button
          type="button"
          dir="ltr"
          onClick={() => setPartnershipOpen(true)}
          aria-label={t("partnershipFloatLabel")}
          className="flex items-center gap-2 rounded-full bg-dark px-3.5 py-3 text-xs font-semibold text-white shadow-lg shadow-dark/20 transition hover:scale-105 hover:bg-dark-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark sm:px-4 sm:text-sm"
        >
          <PartnershipIcon />
          <span dir={locale === "ar" ? "rtl" : "ltr"}>{t("partnershipFloatLabel")}</span>
        </button>

        <Link
          href="/shop?tab=offers"
          dir="ltr"
          aria-label={t("offersFloatLabel")}
          className="flex items-center gap-2 rounded-full bg-primary px-3.5 py-3 text-xs font-semibold text-white shadow-lg shadow-primary/30 transition hover:scale-105 hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4 sm:text-sm"
        >
          <OffersIcon />
          <span dir={locale === "ar" ? "rtl" : "ltr"}>{t("offersFloatLabel")}</span>
        </Link>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("whatsappFloatLabel")}
        className={`${floatButtonClassName} bg-[#25D366] text-white shadow-[#25D366]/30 hover:bg-[#20BD5A] focus-visible:outline-[#25D366]`}
      >
        <WhatsAppIcon />
      </a>
      </div>

      <PartnershipFormModal
        isOpen={partnershipOpen}
        onClose={() => setPartnershipOpen(false)}
      />
    </>
  );
}
