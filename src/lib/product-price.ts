import type { Product } from "@/data/products";

export function formatProductUnitPrice(
  product: Product,
  currency: string,
  labels: {
    perGram: string;
    jar: string;
    customPrice: string;
    comingSoon: string;
  },
) {
  if (product.kind === "custom") return labels.customPrice;
  if (product.kind === "announcement") return labels.comingSoon;

  if (product.unit === "perGram") {
    return `${product.price} ${currency} ${labels.perGram}`;
  }

  return `${product.price} ${currency}`;
}

export function formatCartQuantity(
  product: Product,
  quantity: number,
  labels: { grams: string },
) {
  if (product.unit === "perGram") {
    return `${quantity} ${labels.grams}`;
  }

  return String(quantity);
}
