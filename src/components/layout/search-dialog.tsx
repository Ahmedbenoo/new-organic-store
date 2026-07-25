"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useProducts } from "@/context/products-context";
import { getProductImage } from "@/lib/product-images";
import { formatProductUnitPrice } from "@/lib/product-price";

type SearchDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const t = useTranslations("Search");
  const productsT = useTranslations("Products");
  const common = useTranslations("Common");
  const { products, getProductName } = useProducts();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return products.filter((product) => {
      const name = getProductName(product.id, "ar").toLowerCase();
      const nameEn = getProductName(product.id, "en").toLowerCase();
      const description = product.description_ar.toLowerCase();
      const descriptionEn = product.description_en.toLowerCase();

      return (
        name.includes(normalized) ||
        nameEn.includes(normalized) ||
        description.includes(normalized) ||
        descriptionEn.includes(normalized)
      );
    });
  }, [getProductName, products, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 sm:pt-28">
      <div
        className="absolute inset-0 bg-dark/45 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="animate-slide-down relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-dark/10 bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-dark/8 px-4 py-3">
          <svg
            viewBox="0 0 24 24"
            className="size-5 shrink-0 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("placeholder")}
            className="w-full bg-transparent text-dark outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-secondary/60 hover:text-dark"
          >
            {t("close")}
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() === "" ? (
            <p className="px-3 py-6 text-center text-sm text-muted">{t("hint")}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">{t("noResults")}</p>
          ) : (
            <ul className="space-y-1">
              {results.map((product) => (
                <li key={product.id}>
                  <Link
                    href="/shop"
                    onClick={handleClose}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-secondary/50"
                  >
                    <Image
                      src={product.image_url || getProductImage(product.id, product.category)}
                      alt={getProductName(product.id, "ar")}
                      width={40}
                      height={40}
                      className="size-10 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-dark">
                        {getProductName(product.id, "ar")}
                      </p>
                      <p className="text-sm text-muted">
                        {formatProductUnitPrice(product, common("currency"), {
                          perGram: productsT("units.perGram"),
                          jar: productsT("units.jar"),
                          customPrice: productsT("customPrice"),
                          comingSoon: productsT("comingSoon"),
                        })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
