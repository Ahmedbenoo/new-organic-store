"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProducts } from "@/context/products-context";

export type CartItem = {
  productId: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "golden-hive-cart";

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function CartProviderInner({ children }: { children: ReactNode }) {
  const { getProduct } = useProducts();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateCart() {
      await Promise.resolve();
      if (cancelled) return;
      setItems(readStoredCart());
    }

    void hydrateCart();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => {
      const product = getProduct(item.productId);
      return sum + (product?.price ?? 0) * item.quantity;
    }, 0);

    return {
      items,
      itemCount,
      total,
      addItem(productId: string) {
        const product = getProduct(productId);
        if (!product || product.kind !== "standard") return;

        const initialQuantity = product.defaultQuantity ?? 1;
        const increment =
          product.unit === "perGram" ? product.defaultQuantity ?? 50 : 1;

        setItems((current) => {
          const existing = current.find((item) => item.productId === productId);
          if (existing) {
            return current.map((item) =>
              item.productId === productId
                ? { ...item, quantity: item.quantity + increment }
                : item,
            );
          }
          return [...current, { productId, quantity: initialQuantity }];
        });
      },
      removeItem(productId: string) {
        setItems((current) =>
          current.filter((item) => item.productId !== productId),
        );
      },
      clearCart() {
        setItems([]);
      },
    };
  }, [getProduct, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function CartProvider({ children }: { children: ReactNode }) {
  return <CartProviderInner>{children}</CartProviderInner>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
