"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/cart-context";
import { useProducts } from "@/context/products-context";
import Button from "@/components/ui/button";
import { formatProductUnitPrice } from "@/lib/product-price";
import { getProductImage } from "@/lib/product-images";
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from "@/lib/whatsapp";

type ProductCardProps = {
  productId: string;
  featured?: boolean;
};

export default function ProductCard({
  productId,
  featured = false,
}: ProductCardProps) {
  const t = useTranslations("Products");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { addItem } = useCart();
  const { getProduct, getProductName, getProductDescription } = useProducts();
  const [whatsappOwner, setWhatsappOwner] = useState("201092313486");
  const product = getProduct(productId);

  useEffect(() => {
    void fetch("/api/settings/whatsapp")
      .then((response) => response.json())
      .then((payload: { owner?: string }) => {
        if (payload.owner) setWhatsappOwner(payload.owner);
      })
      .catch(() => undefined);
  }, []);

  if (!product) return null;

  const priceLabel = formatProductUnitPrice(product, common("currency"), {
    perGram: t("units.perGram"),
    jar: t("units.jar"),
    customPrice: t("customPrice"),
    comingSoon: t("comingSoon"),
  });

  const customOrderUrl = buildWhatsAppUrl(
    normalizeWhatsAppNumber(whatsappOwner),
    encodeURIComponent(
      locale === "ar"
        ? `🍯 *طلب ${getProductName(productId, locale)}*\n\nأرغب في طلب تركيبة مخصصة. يرجى التواصل معي لتحديد التفاصيل والسعر.`
        : `🍯 *${getProductName(productId, locale)} Request*\n\nI would like to order a custom blend. Please contact me with details and pricing.`,
    ),
  );

  return (
    <article
      className={`animate-card group flex flex-col overflow-hidden rounded-2xl border border-dark/8 bg-white ${
        featured ? "ring-1 ring-primary/20" : ""
      }`}
    >
      <div className="relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-secondary/80 via-secondary/40 to-background transition-transform duration-500 group-hover:scale-[1.03]">
        <Image
          src={product.image_url || getProductImage(productId, product.category)}
          alt={getProductName(productId, locale)}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {product.kind === "announcement" ? (
          <span className="absolute start-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
            {t("comingSoon")}
          </span>
        ) : product.unit === "perGram" ? (
          <span className="absolute start-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-dark">
            {t("units.perGramBadge")}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t(`categories.${product.category}`)}
          </p>
          <h3 className="text-lg font-bold text-dark">
            {getProductName(productId, locale)}
          </h3>
          <p className="line-clamp-3 text-sm leading-6 text-muted">
            {getProductDescription(productId, locale)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {product.kind === "standard" ? (
            <Button
              variant="primary"
              className="px-4 py-2 text-xs"
              onClick={() => addItem(product.id)}
            >
              {common("addToCart")}
            </Button>
          ) : product.kind === "custom" ? (
            <a
              href={customOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover"
            >
              {t("requestBlend")}
            </a>
          ) : (
            <Link
              href="/contact"
              className="inline-flex rounded-full border border-dark/10 px-4 py-2 text-xs font-semibold text-dark transition hover:bg-secondary/50"
            >
              {t("notifyMe")}
            </Link>
          )}

          <p className="text-end text-base font-bold text-dark sm:text-lg">
            {priceLabel}
          </p>
        </div>
      </div>
    </article>
  );
}
