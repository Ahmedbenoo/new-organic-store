"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import ProductCard from "@/components/shop/product-card";
import { useProducts } from "@/context/products-context";
import { productCategories, type ProductCategory } from "@/data/products";

const PRODUCTS_PER_PAGE = 6;

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

export default function ShopGrid() {
  const t = useTranslations("Shop");
  const productsT = useTranslations("Products");
  const { products, loading } = useProducts();
  const [activeCategory, setActiveCategory] = useState<ProductCategory>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered =
    activeCategory === "all"
      ? products
      : products.filter((product) => product.category === activeCategory);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, pageCount);
  const startIndex = (safePage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = Math.min(startIndex + PRODUCTS_PER_PAGE, filtered.length);
  const paginated = filtered.slice(startIndex, endIndex);

  const handleCategoryChange = (category: ProductCategory) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [safePage, activeCategory]);

  if (loading) {
    return <div className="py-16 text-center text-muted">{t("loading")}</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2">
          {productCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`rounded-full px-3 py-2 text-xs font-medium transition-all duration-250 sm:px-4 sm:text-sm ${
                activeCategory === category
                  ? "bg-primary text-white shadow-sm"
                  : "bg-secondary/60 text-dark hover:bg-secondary"
              }`}
            >
              {t(`filters.${category}`)}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-dashed border-dark/10 py-16 text-center text-muted">
          {t("emptyCategory")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {productCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => handleCategoryChange(category)}
            className={`rounded-full px-3 py-2 text-xs font-medium transition-all duration-250 sm:px-4 sm:text-sm ${
              activeCategory === category
                ? "bg-primary text-white shadow-sm"
                : "bg-secondary/60 text-dark hover:bg-secondary"
            }`}
          >
            {t(`filters.${category}`)}
          </button>
        ))}
      </div>

      {activeCategory !== "all" ? (
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-dark">
            {productsT(`categories.${activeCategory}`)}
          </h2>
          <p className="text-sm text-muted">
            {productsT(`categoryDescriptions.${activeCategory}`)}
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
