"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import OfferCard from "@/components/shop/offer-card";
import ProductCard from "@/components/shop/product-card";
import { useProducts } from "@/context/products-context";
import { productCategories, type ProductCategory } from "@/data/products";
import type { ShopOffer } from "@/lib/types";

const PRODUCTS_PER_PAGE = 6;

type ShopFilter = ProductCategory | "offers";

type ShopPaginationProps = {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

function ShopPagination({
  currentPage,
  pageCount,
  onPageChange,
}: ShopPaginationProps) {
  const t = useTranslations("Shop");

  if (pageCount <= 1) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label={t("paginationLabel")}
    >
      <button
        type="button"
        className="rounded-full border border-dark/10 bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        {t("previous")}
      </button>

      {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          aria-current={page === currentPage ? "page" : undefined}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-250 ${
            currentPage === page
              ? "bg-primary text-white shadow-sm"
              : "border border-dark/10 bg-white text-dark hover:bg-secondary/10"
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        className="rounded-full border border-dark/10 bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onPageChange(Math.min(currentPage + 1, pageCount))}
        disabled={currentPage === pageCount}
      >
        {t("next")}
      </button>
    </nav>
  );
}

function filterProducts(
  products: ReturnType<typeof useProducts>["products"],
  activeFilter: Exclude<ShopFilter, "offers">,
) {
  if (activeFilter === "all") {
    return products;
  }

  return products.filter((product) => product.category === activeFilter);
}

export default function ShopGrid() {
  const t = useTranslations("Shop");
  const productsT = useTranslations("Products");
  const { products, loading } = useProducts();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<ShopFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [offers, setOffers] = useState<ShopOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("tab") === "offers") {
      setActiveFilter("offers");
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeFilter !== "offers") return;

    let cancelled = false;
    setOffersLoading(true);

    void fetch("/api/offers")
      .then((response) => response.json())
      .then((payload: { offers?: ShopOffer[] }) => {
        if (!cancelled) {
          setOffers(payload.offers ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setOffers([]);
      })
      .finally(() => {
        if (!cancelled) setOffersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeFilter]);

  const filtered =
    activeFilter === "offers"
      ? []
      : filterProducts(products, activeFilter);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, pageCount);
  const startIndex = (safePage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = Math.min(startIndex + PRODUCTS_PER_PAGE, filtered.length);
  const paginated = filtered.slice(startIndex, endIndex);

  const handleFilterChange = (filter: ShopFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);

    if (filter === "offers") {
      router.replace(`${pathname}?tab=offers`, { scroll: false });
      return;
    }

    router.replace(pathname, { scroll: false });
  };

  useEffect(() => {
    if (activeFilter === "offers") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [safePage, activeFilter]);

  useEffect(() => {
    if (searchParams.get("tab") === "offers") {
      document.getElementById("shop-filters")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [searchParams]);

  const categoryFilters = productCategories.filter(
    (category) => category !== "all",
  );

  const filterButtons = (
    <div id="shop-filters" className="flex scroll-mt-24 flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleFilterChange("all")}
        className={`rounded-full px-3 py-2 text-xs font-medium transition-all duration-250 sm:px-4 sm:text-sm ${
          activeFilter === "all"
            ? "bg-primary text-white shadow-sm"
            : "bg-secondary/60 text-dark hover:bg-secondary"
        }`}
      >
        {t("filters.all")}
      </button>

      {categoryFilters.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => handleFilterChange(category)}
          className={`rounded-full px-3 py-2 text-xs font-medium transition-all duration-250 sm:px-4 sm:text-sm ${
            activeFilter === category
              ? "bg-primary text-white shadow-sm"
              : "bg-secondary/60 text-dark hover:bg-secondary"
          }`}
        >
          {t(`filters.${category}`)}
        </button>
      ))}

      <button
        type="button"
        onClick={() => handleFilterChange("offers")}
        className={`rounded-full px-3 py-2 text-xs font-medium transition-all duration-250 sm:px-4 sm:text-sm ${
          activeFilter === "offers"
            ? "bg-primary text-white shadow-sm"
            : "border border-primary/25 bg-primary/10 text-dark hover:bg-primary/15"
        }`}
      >
        {t("filters.offers")}
      </button>
    </div>
  );

  if (activeFilter === "offers") {
    if (offersLoading || loading) {
      return (
        <div className="space-y-8">
          {filterButtons}
          <div className="py-16 text-center text-muted">{t("loading")}</div>
        </div>
      );
    }

    if (offers.length === 0) {
      return (
        <div className="space-y-8">
          {filterButtons}
          <div className="rounded-2xl border border-dashed border-dark/10 py-16 text-center text-muted">
            {t("emptyOffers")}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {filterButtons}

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-dark">{t("offersTitle")}</h2>
          <p className="text-sm text-muted">{t("offersDescription")}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {offers.map((offer, index) => (
            <div
              key={offer.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <OfferCard offer={offer} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="py-16 text-center text-muted">{t("loading")}</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="space-y-8">
        {filterButtons}
        <div className="rounded-2xl border border-dashed border-dark/10 py-16 text-center text-muted">
          {t("emptyCategory")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {filterButtons}

      {activeFilter !== "all" ? (
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-dark">
            {productsT(`categories.${activeFilter}`)}
          </h2>
          <p className="text-sm text-muted">
            {productsT(`categoryDescriptions.${activeFilter}`)}
          </p>
        </div>
      ) : null}

      {pageCount > 1 ? (
        <p className="text-sm text-muted">
          {t("showingResults", {
            from: startIndex + 1,
            to: endIndex,
            total: filtered.length,
            page: safePage,
            pages: pageCount,
          })}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paginated.map((product, index) => (
          <div
            key={product.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <ProductCard productId={product.id} />
          </div>
        ))}
      </div>

      <ShopPagination
        currentPage={safePage}
        pageCount={pageCount}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
