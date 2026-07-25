"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  formatOrderNumber,
  getSavedCustomerPhone,
  getSavedOrderIds,
  saveCustomerPhone,
} from "@/lib/customer-orders";
import type { Order } from "@/lib/supabase";

const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function MyOrders() {
  const t = useTranslations("Orders");
  const common = useTranslations("Common");
  const locale = useLocale();
  const [phone, setPhone] = useState(() =>
    typeof window === "undefined" ? "" : getSavedCustomerPhone(),
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return Boolean(getSavedCustomerPhone() || getSavedOrderIds().length > 0);
  });
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (phoneValue: string) => {
    setSearching(true);
    setError("");

    try {
      const savedIds = getSavedOrderIds();
      const params = new URLSearchParams();

      if (phoneValue.trim()) params.set("phone", phoneValue.trim());
      if (savedIds.length > 0) params.set("ids", savedIds.join(","));

      const response = await fetch(`/api/orders/lookup?${params.toString()}`);
      const payload = (await response.json()) as {
        orders?: Order[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? t("loadError"));
      }

      setOrders(payload.orders ?? []);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : t("loadError");
      setError(message);
      setOrders([]);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    const savedPhone = getSavedCustomerPhone();
    const savedIds = getSavedOrderIds();

    if (!savedPhone && savedIds.length === 0) {
      return;
    }

    async function loadOrders() {
      setSearching(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (savedPhone.trim()) params.set("phone", savedPhone.trim());
        if (savedIds.length > 0) params.set("ids", savedIds.join(","));

        const response = await fetch(`/api/orders/lookup?${params.toString()}`);
        const payload = (await response.json()) as {
          orders?: Order[];
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(payload.error ?? t("loadError"));
        }

        setOrders(payload.orders ?? []);
      } catch (fetchError) {
        if (cancelled) return;
        const message =
          fetchError instanceof Error ? fetchError.message : t("loadError");
        setError(message);
        setOrders([]);
      } finally {
        if (!cancelled) {
          setSearching(false);
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [t]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();

    if (!phone.trim()) {
      setError(t("phoneRequired"));
      return;
    }

    saveCustomerPhone(phone);
    void fetchOrders(phone);
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-muted">{t("loading")}</div>
    );
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-dark/8 bg-white p-5 shadow-sm sm:p-6"
      >
        <label className="mb-2 block text-sm font-medium text-dark">
          {t("phoneLabel")}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={t("phonePlaceholder")}
            className="flex-1 rounded-xl border border-dark/10 bg-background px-4 py-2.5 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-full bg-primary px-6 py-2.5 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {searching ? t("searching") : t("search")}
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">{t("phoneHint")}</p>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {orders.length === 0 && !searching && !error ? (
        <div className="rounded-2xl border-2 border-dashed border-dark/10 py-16 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-3 text-lg font-semibold text-dark">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("emptyDescription")}</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            {t("shopNow")}
          </Link>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-dark">
              {t("resultsCount", { count: orders.length })}
            </h2>
            <button
              type="button"
              onClick={() => void fetchOrders(phone)}
              disabled={searching}
              className="rounded-lg border border-dark/10 px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-secondary/50 hover:text-dark disabled:opacity-60"
            >
              {t("refresh")}
            </button>
          </div>

          {orders.map((order) => {
            const isExpanded = expandedId === order.id;

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-dark/8 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : order.id)
                  }
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-start transition hover:bg-secondary/20 sm:px-6"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-dark">
                      {t("orderNumber", {
                        number: formatOrderNumber(order.id),
                      })}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(order.created_at).toLocaleString(locale)}
                    </p>
                    <p className="text-sm text-dark-muted">
                      {order.items.length}{" "}
                      {t("itemsCount", { count: order.items.length })}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status]}`}
                    >
                      {t(`status.${order.status}`)}
                    </span>
                    <span className="font-bold text-dark">
                      {order.total.toLocaleString(locale)} {common("currency")}
                    </span>
                  </div>
                </button>

                {isExpanded ? (
                  <div className="border-t border-dark/8 bg-secondary/20 px-5 py-4 sm:px-6">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-dark">{t("customer")}</dt>
                        <dd className="text-muted">{order.customer_name}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-dark">{t("phone")}</dt>
                        <dd className="text-muted">{order.customer_phone}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-medium text-dark">{t("address")}</dt>
                        <dd className="text-muted">{order.customer_address}</dd>
                      </div>
                      {order.notes ? (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-dark">{t("notes")}</dt>
                          <dd className="text-muted">{order.notes}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <ul className="mt-4 space-y-2 border-t border-dark/8 pt-4">
                      {order.items.map((item) => (
                        <li
                          key={`${order.id}-${item.productId}`}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-dark">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="font-medium text-dark">
                            {(item.price * item.quantity).toLocaleString(locale)}{" "}
                            {common("currency")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
