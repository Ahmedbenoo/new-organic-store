"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/language-switcher";
import Logo from "@/components/layout/logo";
import NavLinks from "@/components/layout/nav-links";
import { SiteContainer } from "@/components/layout/site-container";
import Button from "@/components/ui/button";
import { useCart } from "@/context/cart-context";

const CartDrawer = dynamic(() => import("@/components/layout/cart-drawer"), {
  ssr: false,
});
const SearchDialog = dynamic(() => import("@/components/layout/search-dialog"), {
  ssr: false,
});
const MobileMenu = dynamic(() => import("@/components/layout/mobile-menu"), {
  ssr: false,
});

export default function Navbar() {
  const t = useTranslations("Navigation");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const { itemCount } = useCart();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-dark/8 bg-background/95">
        <SiteContainer>
          <div className="nav flex h-[4.5rem] w-full items-center gap-3 lg:h-[4.75rem] lg:gap-4">
            <div className="shrink-0">
              <Logo />
            </div>

            <nav
              className="hidden min-w-0 flex-1 lg:flex lg:justify-center"
              aria-label={t("mainNav")}
            >
              <NavLinks
                className="flex items-center gap-4 xl:gap-6"
                linkClassName="nav-link-hover whitespace-nowrap text-[13px] font-medium text-dark-muted hover:text-primary xl:text-sm"
                activeLinkClassName="nav-link-hover whitespace-nowrap text-[13px] font-semibold text-primary xl:text-sm"
              />
            </nav>

            <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex size-10 items-center justify-center rounded-lg text-dark-muted transition hover:bg-secondary/70 hover:text-dark"
                aria-label={t("search")}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCartLoaded(true);
                  setIsCartOpen(true);
                }}
                className="relative inline-flex size-10 items-center justify-center rounded-lg text-dark-muted transition hover:bg-secondary/70 hover:text-dark"
                aria-label={t("cart")}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                  <path d="M6 6L5 3H2" strokeLinecap="round" />
                </svg>
                {itemCount > 0 ? (
                  <span className="absolute -end-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                ) : null}
              </button>

              <Button
                href="/shop"
                variant="primary"
                className="shop hidden px-4 py-2 text-xs xl:inline-flex"
              >
                {t("cta")}
              </Button>

              <LanguageSwitcher
                variant="compact"
                className="language hidden xl:inline-flex"
              />

              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="inline-flex size-10 items-center justify-center rounded-lg border border-dark/10 text-dark transition hover:bg-secondary/60 lg:hidden"
                aria-label={t("openMenu")}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              </button>
            </div>

          </div>
        </SiteContainer>
      </header>

      {isMenuOpen ? (
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onOpenSearch={() => {
            setIsMenuOpen(false);
            setIsSearchOpen(true);
          }}
          onOpenCart={() => {
            setIsMenuOpen(false);
            setCartLoaded(true);
            setIsCartOpen(true);
          }}
        />
      ) : null}

      {isSearchOpen ? (
        <SearchDialog
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      ) : null}
      {cartLoaded ? (
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      ) : null}
    </>
  );
}
