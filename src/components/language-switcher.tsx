"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

type LanguageSwitcherProps = {
  variant?: "default" | "compact";
  className?: string;
};

export default function LanguageSwitcher({
  variant = "default",
  className = "",
}: LanguageSwitcherProps) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  function handleLocaleChange(nextLocale: AppLocale) {
    router.replace(pathname, { locale: nextLocale });
  }

  const containerClass =
    variant === "compact"
      ? "inline-flex items-center gap-1 rounded-lg border border-dark/10 bg-secondary/40 p-0.5"
      : "inline-flex items-center gap-1 rounded-full border border-dark/10 bg-white p-1 shadow-sm";

  const buttonClass = (isActive: boolean) =>
    variant === "compact"
      ? `rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
          isActive
            ? "bg-primary text-white"
            : "text-dark-muted hover:bg-secondary"
        }`
      : `rounded-full px-3 py-1.5 text-sm font-medium transition ${
          isActive
            ? "bg-primary text-white"
            : "text-dark-muted hover:bg-secondary"
        }`;

  return (
    <div
      className={`${containerClass} ${className}`}
      role="group"
      aria-label={t("label")}
    >
      {routing.locales.map((nextLocale) => {
        const isActive = locale === nextLocale;

        return (
          <button
            key={nextLocale}
            type="button"
            onClick={() => handleLocaleChange(nextLocale)}
            aria-pressed={isActive}
            className={buttonClass(isActive)}
          >
            {t(nextLocale)}
          </button>
        );
      })}
    </div>
  );
}
