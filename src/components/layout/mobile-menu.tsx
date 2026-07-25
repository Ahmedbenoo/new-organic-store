"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/language-switcher";
import Logo from "@/components/layout/logo";
import NavLinks from "@/components/layout/nav-links";
import { mainNavItems } from "@/config/navigation";
import Button from "@/components/ui/button";
import { useCart } from "@/context/cart-context";

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
};

export default function MobileMenu({
  isOpen,
  onClose,
  onOpenSearch,
  onOpenCart,
}: MobileMenuProps) {
  const t = useTranslations("Navigation");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { itemCount } = useCart();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="mobile-menu"
        aria-label={t("mobileMenu")}
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 end-0 z-50 flex w-full max-w-sm flex-col border-s border-dark/10 bg-background shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-dark/8 px-5 py-4">
          <Logo />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-lg text-dark transition hover:bg-secondary/60"
            aria-label={t("closeMenu")}
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 border-b border-dark/8 px-5 py-3">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm font-medium text-dark"
          >
            🔍 {t("search")}
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm font-medium text-dark"
          >
            🛒 {t("cart")}
            {itemCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {itemCount}
              </span>
            ) : null}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label={t("mainNav")}>
          <NavLinks
            items={mainNavItems}
            onNavigate={onClose}
            className="flex flex-col gap-1"
            linkClassName="block rounded-xl px-3 py-3 text-base font-medium text-dark-muted transition hover:bg-secondary/60 hover:text-primary"
            activeLinkClassName="block rounded-xl bg-secondary px-3 py-3 text-base font-semibold text-primary"
          />
        </nav>

        <div className="space-y-3 border-t border-dark/8 px-5 py-5">
          <Button href="/shop" variant="primary" className="w-full">
            {t("cta")}
          </Button>
          <LanguageSwitcher variant="default" className="w-full justify-center" />
        </div>
      </aside>
    </>
  );
}
