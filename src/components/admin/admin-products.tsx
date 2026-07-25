"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import ImagePicker from "@/components/admin/image-picker";
import { productCategories } from "@/data/products";
import type { CatalogProduct, ProductKind, ProductUnit, StoreCategory } from "@/lib/types";

type EditingProduct = Omit<CatalogProduct, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};

const CATEGORY_OPTIONS = productCategories.filter(
  (category): category is StoreCategory => category !== "all",
);

const EMPTY_PRODUCT: EditingProduct = {
  id: "",
  name_ar: "",
  name_en: "",
  description_ar: "",
  description_en: "",
  price: 0,
  category: "natural-honey",
  emoji: "🍯",
  unit: "fixed",
  kind: "standard",
  image_url: "/assets/img1.jpeg",
  active: true,
  sort_order: 999,
};

function matchesSearch(product: CatalogProduct, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    product.id.toLowerCase().includes(normalized) ||
    product.name_en.toLowerCase().includes(normalized) ||
    product.name_ar.includes(query.trim()) ||
    product.category.toLowerCase().includes(normalized) ||
    product.description_en.toLowerCase().includes(normalized) ||
    product.description_ar.includes(query.trim())
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<StoreCategory | "all">(
    "all",
  );

  const refreshProducts = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/products?all=true");
      const payload = (await response.json()) as { products?: CatalogProduct[] };

      if (response.ok) {
        setProducts(payload.products ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);

      try {
        const response = await fetch("/api/products?all=true");
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
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }

      return matchesSearch(product, searchQuery);
    });
  }, [products, searchQuery, categoryFilter]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  async function saveProduct() {
    if (!editing) return;
    setSaving(true);

    try {
      const response = await fetch(
        isCreating ? "/api/products" : `/api/products/${editing.id}`,
        {
          method: isCreating ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing),
        },
      );

      if (!response.ok) {
        showToast("Error saving product");
        return;
      }

      showToast(isCreating ? "Product created!" : "Product saved!");
      setEditing(null);
      setIsCreating(false);
      await refreshProducts();
    } catch {
      showToast("Error saving product");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(productId: string, active: boolean) {
    const response = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });

    if (response.ok) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, active } : product,
        ),
      );
    }
  }

  async function deleteProduct(productId: string) {
    if (!window.confirm("Delete this product?")) return;

    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showToast("Product deleted");
      await refreshProducts();
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">
            {filteredProducts.length} of {products.length} products shown
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing({ ...EMPTY_PRODUCT });
            setIsCreating(true);
          }}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          + Add Product
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by Arabic/English name, ID, or category..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-10 pe-4 text-sm outline-none focus:border-amber-400"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value as StoreCategory | "all")
          }
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-400 sm:min-w-52"
        >
          <option value="all">All categories</option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-lg font-semibold text-gray-700">No products found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try a different search term or category filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`overflow-hidden rounded-2xl border bg-white transition ${
                product.active ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="relative h-44 overflow-hidden bg-amber-50">
                <Image
                  src={product.image_url || "/assets/img1.jpeg"}
                  alt={product.name_en}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="300px"
                />
                <div className="absolute end-3 top-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(product.id, !product.active)}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                      product.active
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {product.active ? "Active" : "Hidden"}
                  </button>
                </div>
              </div>

              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  {product.category}
                </p>
                <h3 className="mt-1 font-bold text-gray-900">{product.name_en}</h3>
                <p className="text-xs text-gray-500">{product.name_ar}</p>
                <p className="mt-2 text-xl font-bold text-gray-900">
                  {product.kind === "standard"
                    ? `${product.price.toLocaleString()} EGP`
                    : product.kind === "custom"
                      ? "Custom pricing"
                      : "Coming soon"}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing({ ...product });
                      setIsCreating(false);
                    }}
                    className="flex-1 rounded-xl bg-amber-500 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteProduct(product.id)}
                    className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setEditing(null);
              setIsCreating(false);
            }}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">
                {isCreating ? "Add Product" : "Edit Product"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setIsCreating(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-6">
              <ImagePicker
                value={editing.image_url}
                onChange={(image_url) => setEditing({ ...editing, image_url })}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Name (Arabic)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={editing.name_ar}
                    onChange={(event) =>
                      setEditing({ ...editing, name_ar: event.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Name (English)
                  </label>
                  <input
                    type="text"
                    value={editing.name_en}
                    onChange={(event) =>
                      setEditing({ ...editing, name_en: event.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description (Arabic)
                  </label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={editing.description_ar}
                    onChange={(event) =>
                      setEditing({ ...editing, description_ar: event.target.value })
                    }
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description (English)
                  </label>
                  <textarea
                    rows={3}
                    value={editing.description_en}
                    onChange={(event) =>
                      setEditing({ ...editing, description_en: event.target.value })
                    }
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editing.price}
                    onChange={(event) =>
                      setEditing({ ...editing, price: Number(event.target.value) })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={editing.category}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        category: event.target.value as StoreCategory,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  <select
                    value={editing.unit}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        unit: event.target.value as ProductUnit,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  >
                    <option value="fixed">Fixed price</option>
                    <option value="perGram">Per gram</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={editing.kind}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        kind: event.target.value as ProductKind,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  >
                    <option value="standard">Standard</option>
                    <option value="custom">Custom blend</option>
                    <option value="announcement">Coming soon</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Default quantity (grams)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editing.defaultQuantity ?? 0}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        defaultQuantity: Number(event.target.value) || undefined,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={editing.emoji}
                    onChange={(event) =>
                      setEditing({ ...editing, emoji: event.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Sort order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editing.sort_order}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        sort_order: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(event) =>
                    setEditing({ ...editing, active: event.target.checked })
                  }
                  className="size-4 rounded accent-amber-500"
                />
                Product is visible on website
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setIsCreating(false);
                  }}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProduct}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
