"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ImagePicker from "@/components/admin/image-picker";
import { adminLabels } from "@/lib/admin-labels";
import type { CatalogProduct, ShopOffer } from "@/lib/types";
import { createDefaultOffers } from "@/lib/shop-offers-defaults";

export default function AdminOffers() {
  const [offers, setOffers] = useState<ShopOffer[]>(createDefaultOffers());
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);

      try {
        const [offersResponse, productsResponse] = await Promise.all([
          fetch("/api/offers?all=true"),
          fetch("/api/products?all=true"),
        ]);

        const offersPayload = (await offersResponse.json()) as {
          offers?: ShopOffer[];
        };
        const productsPayload = (await productsResponse.json()) as {
          products?: CatalogProduct[];
        };

        if (!cancelled) {
          if (offersResponse.ok && offersPayload.offers?.length) {
            setOffers(offersPayload.offers);
          }

          if (productsResponse.ok) {
            setProducts(productsPayload.products ?? []);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function updateOffer(id: string, patch: Partial<ShopOffer>) {
    setOffers((prev) =>
      prev.map((offer) => (offer.id === id ? { ...offer, ...patch } : offer)),
    );
  }

  async function saveOffers() {
    setSaving(true);

    try {
      const response = await fetch("/api/offers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offers }),
      });

      if (!response.ok) {
        showToast(adminLabels.offers.errorSaving);
        return;
      }

      const payload = (await response.json()) as { offers?: ShopOffer[] };
      setOffers(payload.offers ?? offers);
      showToast(adminLabels.offers.saved);
    } catch {
      showToast(adminLabels.offers.errorSaving);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-400">{adminLabels.offers.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{adminLabels.offers.title}</h2>
          <p className="text-sm text-gray-500">
            {adminLabels.offers.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={saveOffers}
          disabled={saving}
          className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60 sm:w-auto"
        >
          {saving ? adminLabels.saving : adminLabels.offers.saveOffers}
        </button>
      </div>

      {toast ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-xl bg-green-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg sm:inset-x-auto sm:end-6 sm:bottom-6 sm:mx-0 sm:text-start">
          {toast}
        </div>
      ) : null}

      <div className="space-y-4">
        {offers.map((offer, index) => {
          const isEditingImage = editingImageId === offer.id;

          return (
            <div
              key={offer.id}
              className={`overflow-hidden rounded-2xl border bg-white ${
                offer.active ? "border-gray-200" : "border-gray-100 opacity-70"
              }`}
            >
              <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-amber-50 sm:w-48">
                  <Image
                    src={offer.image_url || "/assets/img1.jpeg"}
                    alt={offer.title_en}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="192px"
                  />
                  <span className="absolute start-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
                    {offer.badge_en || adminLabels.offer}
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {adminLabels.offers.offerNumber.replace("{n}", String(index + 1))}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateOffer(offer.id, { active: !offer.active })
                      }
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        offer.active
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {offer.active ? adminLabels.visible : adminLabels.hidden}
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        {adminLabels.fields.titleEnglish}
                      </label>
                      <input
                        type="text"
                        value={offer.title_en}
                        onChange={(event) =>
                          updateOffer(offer.id, { title_en: event.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        {adminLabels.fields.titleArabic}
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={offer.title_ar}
                        onChange={(event) =>
                          updateOffer(offer.id, { title_ar: event.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        {adminLabels.fields.descriptionEnglish}
                      </label>
                      <textarea
                        rows={2}
                        value={offer.description_en}
                        onChange={(event) =>
                          updateOffer(offer.id, {
                            description_en: event.target.value,
                          })
                        }
                        className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        {adminLabels.fields.descriptionArabic}
                      </label>
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={offer.description_ar}
                        onChange={(event) =>
                          updateOffer(offer.id, {
                            description_ar: event.target.value,
                          })
                        }
                        className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        {adminLabels.fields.badgeEnglish}
                      </label>
                      <input
                        type="text"
                        value={offer.badge_en}
                        onChange={(event) =>
                          updateOffer(offer.id, { badge_en: event.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        {adminLabels.fields.badgeArabic}
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={offer.badge_ar}
                        onChange={(event) =>
                          updateOffer(offer.id, { badge_ar: event.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        {adminLabels.linkedProduct}
                      </label>
                      <select
                        value={offer.product_id ?? ""}
                        onChange={(event) =>
                          updateOffer(offer.id, {
                            product_id: event.target.value || undefined,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                      >
                        <option value="">{adminLabels.noProduct}</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingImageId(isEditingImage ? null : offer.id)
                    }
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    {isEditingImage ? adminLabels.closeImagePicker : adminLabels.changeImage}
                  </button>

                  {isEditingImage ? (
                    <ImagePicker
                      label={adminLabels.offers.offerImage}
                      value={offer.image_url}
                      onChange={(image_url) =>
                        updateOffer(offer.id, { image_url })
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
