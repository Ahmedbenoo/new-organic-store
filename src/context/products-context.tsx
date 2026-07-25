"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatalogProduct } from "@/lib/types";

type ProductsContextValue = {
  products: CatalogProduct[];
  loading: boolean;
  getProduct: (id: string) => CatalogProduct | undefined;
  getProductName: (id: string, locale: string) => string;
  getProductDescription: (id: string, locale: string) => string;
  refreshProducts: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({
  children,
  initialProducts = [],
}: {
  children: ReactNode;
  initialProducts?: CatalogProduct[];
}) {
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  async function refreshProducts() {
    setLoading(true);

    try {
      const response = await fetch("/api/products");
      const payload = (await response.json()) as {
        products?: CatalogProduct[];
      };

      if (response.ok) {
        setProducts(payload.products ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialProducts.length > 0) return;

    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const payload = (await response.json()) as {
          products?: CatalogProduct[];
        };

        if (!cancelled && response.ok) {
          setProducts(payload.products ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [initialProducts.length]);

  const value = useMemo<ProductsContextValue>(() => {
    const map = new Map(products.map((product) => [product.id, product]));

    return {
      products,
      loading,
      getProduct(id) {
        return map.get(id);
      },
      getProductName(id, locale) {
        const product = map.get(id);
        if (!product) return id;
        return locale === "ar" ? product.name_ar : product.name_en;
      },
      getProductDescription(id, locale) {
        const product = map.get(id);
        if (!product) return "";
        return locale === "ar"
          ? product.description_ar
          : product.description_en;
      },
      refreshProducts,
    };
  }, [products, loading]);

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error("useProducts must be used within ProductsProvider");
  }

  return context;
}
