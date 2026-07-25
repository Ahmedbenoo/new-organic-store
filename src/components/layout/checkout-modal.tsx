"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/context/cart-context";
import { useProducts } from "@/context/products-context";
import {
  formatOrderNumber,
  rememberOrder,
} from "@/lib/customer-orders";
import {
  buildWhatsAppUrl,
  normalizeWhatsAppNumber,
  openWhatsApp,
} from "@/lib/whatsapp";
import { Link } from "@/i18n/navigation";
import type { Order } from "@/lib/types";

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type WhatsAppLabels = {
  title: string;
  customer: string;
  phone: string;
  address: string;
  notes: string;
  items: string;
  total: string;
  currency: string;
};

type OrderItemPayload = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

const DEFAULT_WHATSAPP_OWNER = "201092313486";

function buildWhatsAppMessage(
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  items: OrderItemPayload[],
  total: number,
  notes: string,
  labels: WhatsAppLabels,
  locale: string,
) {
  const itemLines = items
    .map(
      (item) =>
        `• ${item.name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString(locale)} ${labels.currency}`,
    )
    .join("\n");

  return encodeURIComponent(
    `🍯 *${labels.title}*\n\n` +
      `👤 *${labels.customer}:* ${customerName}\n` +
      `📞 *${labels.phone}:* ${customerPhone}\n` +
      `📍 *${labels.address}:* ${customerAddress}\n` +
      (notes ? `📝 *${labels.notes}:* ${notes}\n` : "") +
      `\n*${labels.items}:*\n${itemLines}\n\n` +
      `💰 *${labels.total}: ${total.toLocaleString(locale)} ${labels.currency}*\n\n` +
      `⏰ ${new Date().toLocaleString(locale)}`,
  );
}

function buildOrderItems(
  items: { productId: string; quantity: number }[],
  getProductName: (id: string, locale: string) => string,
  getProduct: (id: string) => { price: number } | undefined,
  locale: string,
) {
  return items.map((item) => {
    const product = getProduct(item.productId);

    return {
      productId: item.productId,
      name: getProductName(item.productId, locale),
      price: product?.price ?? 0,
      quantity: item.quantity,
    };
  });
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const t = useTranslations("Checkout");
  const cartT = useTranslations("Cart");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { items, total, clearCart } = useCart();
  const { getProduct, getProductName } = useProducts();
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [whatsappOwner, setWhatsappOwner] = useState(DEFAULT_WHATSAPP_OWNER);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setStep("form");
    setSaveError("");
    setWhatsappUrl("");
    setPlacedOrder(null);
    setForm({ name: "", phone: "", address: "", notes: "" });
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    void fetch("/api/settings/whatsapp")
      .then((response) => response.json())
      .then((payload: { owner?: string }) => {
        if (payload.owner) setWhatsappOwner(payload.owner);
      })
      .catch(() => undefined);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  async function saveOrder(orderItems: OrderItemPayload[]) {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        items: orderItems,
        total,
        notes: form.notes,
        whatsapp_sent: true,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(payload?.error ?? "Failed to save order");
    }

    const payload = (await response.json()) as { order: Order };
    return payload.order;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSaveError("");

    const orderItems = buildOrderItems(items, getProductName, getProduct, locale);
    const labels: WhatsAppLabels = {
      title: t("whatsappTitle"),
      customer: t("whatsappCustomer"),
      phone: t("whatsappPhone"),
      address: t("whatsappAddress"),
      notes: t("whatsappNotes"),
      items: t("whatsappItems"),
      total: t("whatsappTotal"),
      currency: common("currency"),
    };

    const message = buildWhatsAppMessage(
      form.name,
      form.phone,
      form.address,
      orderItems,
      total,
      form.notes,
      labels,
      locale,
    );

    const ownerNumber = normalizeWhatsAppNumber(whatsappOwner);
    const nextWhatsappUrl = buildWhatsAppUrl(ownerNumber, message);
    setWhatsappUrl(nextWhatsappUrl);
    openWhatsApp(nextWhatsappUrl);

    void (async () => {
      try {
        const savedOrder = await saveOrder(orderItems);
        rememberOrder(savedOrder.id, form.phone);
        setPlacedOrder(savedOrder);
        clearCart();
        setStep("success");
      } catch (error) {
        console.error("Order save failed:", error);
        setSaveError(t("orderSaveError"));
        setStep("success");
      } finally {
        setSubmitting(false);
      }
    })();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-background shadow-2xl"
      >
        {step === "success" ? (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="text-6xl">✅</span>
            <h2 className="text-2xl font-bold text-dark">{t("successTitle")}</h2>
            <p className="text-muted">
              {saveError || t("successMessage")}
            </p>

            {placedOrder ? (
              <div className="w-full rounded-2xl border border-dark/8 bg-secondary/30 px-5 py-4 text-start">
                <p className="text-sm font-medium text-muted">{t("orderNumber")}</p>
                <p className="mt-1 text-lg font-bold text-dark">
                  #{formatOrderNumber(placedOrder.id)}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">{t("orderStatus")}</span>
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                    {t(`status.${placedOrder.status}`)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-dark">
                  {placedOrder.total.toLocaleString(locale)} {common("currency")}
                </p>
              </div>
            ) : null}

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#25D366] px-8 py-3 font-semibold text-white transition hover:opacity-90"
              >
                {t("openWhatsApp")}
              </a>
            ) : null}

            {placedOrder ? (
              <Link
                href="/orders"
                onClick={handleClose}
                className="rounded-full border border-primary px-8 py-3 font-semibold text-primary transition hover:bg-primary/5"
              >
                {t("viewMyOrders")}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={handleClose}
              className="rounded-full bg-primary px-8 py-3 font-semibold text-white transition hover:bg-primary-hover"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-dark/8 px-6 py-4">
              <h2 className="text-lg font-bold text-dark">{t("title")}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-muted transition hover:text-dark"
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto">
              <div className="border-b border-dark/8 bg-secondary/30 px-6 py-4">
                <p className="mb-2 text-sm font-semibold text-dark">
                  {t("orderSummary", { count: items.length })}
                </p>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const product = getProduct(item.productId);

                    return (
                      <li
                        key={item.productId}
                        className="flex justify-between text-sm text-muted"
                      >
                        <span>
                          {getProductName(item.productId, locale)} × {item.quantity}
                        </span>
                        <span>
                          {((product?.price ?? 0) * item.quantity).toLocaleString(
                            locale,
                          )}{" "}
                          {common("currency")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex justify-between border-t border-dark/8 pt-3 font-bold text-dark">
                  <span>{cartT("total")}</span>
                  <span>
                    {total.toLocaleString(locale)} {common("currency")}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                {saveError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {saveError}
                  </div>
                ) : null}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark">
                    {t("fullName")} *
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    className="w-full rounded-xl border border-dark/10 bg-white px-4 py-2.5 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder={t("fullNamePlaceholder")}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark">
                    {t("phone")} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                    className="w-full rounded-xl border border-dark/10 bg-white px-4 py-2.5 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder={t("phonePlaceholder")}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark">
                    {t("address")} *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.address}
                    onChange={(event) =>
                      setForm({ ...form, address: event.target.value })
                    }
                    className="w-full resize-none rounded-xl border border-dark/10 bg-white px-4 py-2.5 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder={t("addressPlaceholder")}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark">
                    {t("notes")}
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(event) =>
                      setForm({ ...form, notes: event.target.value })
                    }
                    className="w-full rounded-xl border border-dark/10 bg-white px-4 py-2.5 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder={t("notesPlaceholder")}
                  />
                </div>

                <div className="rounded-xl bg-secondary/50 px-4 py-3 text-sm text-muted">
                  {t("whatsappHint")}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-primary py-3 font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-60"
                >
                  {submitting ? t("submitting") : t("submit")}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
