"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/cart-context";
import { useProducts } from "@/context/products-context";
import Button from "@/components/ui/button";
import { formatProductUnitPrice } from "@/lib/product-price";
import { getProductImage } from "@/lib/product-images";
import type { ShopOffer } from "@/lib/types";

type OfferCardProps = {
  offer: ShopOffer;
};

export default function OfferCard({ offer }: OfferCardProps) {
  const t = useTranslations("Products");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { addItem } = useCart();
  const { getProduct, getProductName } = useProducts();

  const product = offer.product_id ? getProduct(offer.product_id) : undefined;
  const title = locale === "ar" ? offer.title_ar : offer.title_en;
  const description =
    locale === "ar" ? offer.description_ar : offer.description_en;
  const badge = locale === "ar" ? offer.badge_ar : offer.badge_en;
  const imageSrc =
    offer.image_url ||
    (product
      ? product.image_url || getProductImage(product.id, product.category)
      : "/assets/img1.jpeg");

  const priceLabel = product
    ? formatProductUnitPrice(product, common("currency"), {
        perGram: t("units.perGram"),
        jar: t("units.jar"),
        customPrice: t("customPrice"),
        comingSoon: t("comingSoon"),
      })
    : null;

  return (
    <article className="animate-card group flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-white ring-1 ring-primary/10">
      <div className="relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-secondary/80 via-secondary/40 to-background">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {badge ? (
          <span className="absolute start-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {locale === "ar" ? "عرض خاص" : "Special offer"}
          </p>
          <h3 className="text-lg font-bold text-dark">{title}</h3>
          <p className="line-clamp-3 text-sm leading-6 text-muted">{description}</p>
          {product ? (
            <p className="text-sm font-medium text-dark-muted">
              {getProductName(product.id, locale)}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {product?.kind === "standard" ? (
            <Button
              variant="primary"
              className="px-4 py-2 text-xs"
              onClick={() => addItem(product.id)}
            >
              {common("addToCart")}
            </Button>
          ) : (
            <span className="text-xs text-muted">
              {locale === "ar" ? "عرض ترويجي" : "Promotional offer"}
            </span>
          )}

          {priceLabel ? (
            <p className="text-end text-base font-bold text-dark sm:text-lg">
              {priceLabel}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
