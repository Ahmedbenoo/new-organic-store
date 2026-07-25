"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/supabase";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/orders");
      const payload = (await response.json()) as {
        orders?: Order[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load orders");
      }

      setOrders(payload.orders ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load orders";
      console.error("Failed to load orders:", message);
      setLoadError(message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response = await fetch("/api/orders");
        const payload = (await response.json()) as {
          orders?: Order[];
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load orders");
        }

        setOrders(payload.orders ?? []);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Failed to load orders";
        console.error("Failed to load orders:", message);
        setLoadError(message);
        setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  async function updateStatus(orderId: string, status: Order["status"]) {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) return;

    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order)),
    );
    if (selected?.id === orderId) {
      setSelected((prev) => (prev ? { ...prev, status } : prev));
    }
  }

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">Orders</h2>
        <button
          type="button"
          onClick={refreshOrders}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 sm:w-auto sm:py-1.5"
        >
          Refresh
        </button>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load orders: {loadError}. Orders are stored locally in this project until Supabase is configured.
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, color: "bg-gray-100 text-gray-700" },
          { label: "Pending", value: stats.pending, color: "bg-yellow-100 text-yellow-700" },
          { label: "Confirmed", value: stats.confirmed, color: "bg-blue-100 text-blue-700" },
          { label: "Delivered", value: stats.delivered, color: "bg-green-100 text-green-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "confirmed", "delivered", "cancelled"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
              statusFilter === status
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-2xl">📦</p>
          <p className="mt-2 font-medium text-gray-500">No orders yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.customer_phone}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500">Items</dt>
                    <dd className="font-medium text-gray-900">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Total</dt>
                    <dd className="font-semibold text-gray-900">
                      {order.total.toLocaleString()} EGP
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-gray-500">Date</dt>
                    <dd className="text-gray-700">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => setSelected(order)}
                  className="mt-4 w-full rounded-xl bg-amber-50 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  View details
                </button>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {order.total.toLocaleString()} EGP
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(order)}
                      className="text-sm font-medium text-amber-600 hover:text-amber-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Order detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
              <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-semibold text-gray-900">{selected.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-900">{selected.customer_phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Address</p>
                  <p className="font-semibold text-gray-900">{selected.customer_address}</p>
                </div>
                {selected.notes && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Notes</p>
                    <p className="font-semibold text-gray-900">{selected.notes}</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">Items</p>
                <ul className="space-y-2">
                  {selected.items.map((item, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium text-gray-900">
                        {(item.price * item.quantity).toLocaleString()} EGP
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{selected.total.toLocaleString()} EGP</span>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(["pending", "confirmed", "delivered", "cancelled"] as Order["status"][]).map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateStatus(selected.id, s)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                          selected.status === s
                            ? STATUS_COLORS[s]
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>WhatsApp sent:</span>
                <span className={selected.whatsapp_sent ? "text-green-600 font-semibold" : "text-gray-400"}>
                  {selected.whatsapp_sent ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
