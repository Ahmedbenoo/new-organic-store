"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/cart-context";
import { useProducts } from "@/context/products-context";
import Button from "@/components/ui/button";
import { formatCartQuantity } from "@/lib/product-price";
import { getProductImage } from "@/lib/product-images";

const CheckoutModal = dynamic(() => import("@/components/layout/checkout-modal"), {
  ssr: false,
});

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const t = useTranslations("Cart");
  const common = useTranslations("Common");
  const productsT = useTranslations("Products");
  const locale = useLocale();
  const { getProduct, getProductName } = useProducts();
  const { items, itemCount, total, removeItem, clearCart } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen && !isCheckoutOpen) return null;

  return (
    <>
      {isCheckoutOpen ? (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      ) : null}

      {isOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-dark/40"
            onClick={onClose}
            aria-hidden="true"
          />

          <aside
            aria-label={t("title")}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s border-dark/10 bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-dark/8 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-dark">{t("title")}</h2>
                <p className="text-sm text-muted">
                  {t("itemsCount", { count: itemCount })}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="inline-flex size-10 items-center justify-center rounded-lg text-dark transition hover:bg-secondary/60"
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <span className="text-4xl" aria-hidden="true">
                    🛒
                  </span>
                  <p className="font-medium text-dark">{t("empty")}</p>
                  <p className="text-sm text-muted">{t("emptyHint")}</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => {
                    const product = getProduct(item.productId);
                    if (!product) return null;

                    return (
                      <li
                        key={item.productId}
                        className="flex gap-4 rounded-xl border border-dark/8 bg-white p-4"
                      >
                        <Image
                          src={product.image_url || getProductImage(product.id, product.category)}
                          alt={getProductName(item.productId, locale)}
                          width={48}
                          height={48}
                          className="size-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-dark">
                            {getProductName(item.productId, locale)}
                          </p>
                          <p className="text-sm text-muted">
                            {formatCartQuantity(product, item.quantity, {
                              grams: productsT("units.grams"),
                            })}{" "}
                            × {common("currency")}{" "}
                            {product.price * item.quantity}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-sm text-muted transition hover:text-dark"
                          aria-label={t("remove")}
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 ? (
              <div className="space-y-3 border-t border-dark/8 px-5 py-4">
                <div className="flex items-center justify-between text-dark">
                  <span className="font-medium">{t("total")}</span>
                  <span className="text-xl font-bold">
                    {common("currency")} {total}
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    onClose();
                    setIsCheckoutOpen(true);
                  }}
                >
                  {t("checkout")}
                </Button>
                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full text-center text-sm text-muted transition hover:text-dark"
                >
                  {t("clear")}
                </button>
              </div>
            ) : null}
          </aside>
        </>
      ) : null}
    </>
  );
}
