"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ImagePicker from "@/components/admin/image-picker";
import { adminLabels } from "@/lib/admin-labels";
import type { HeroSlide } from "@/lib/types";

function createEmptySlide(sortOrder: number): HeroSlide {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    image_url: "/assets/img1.jpeg",
    label_en: "New slide",
    label_ar: adminLabels.slider.newSlide,
    active: true,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  };
}

export default function AdminSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSlides() {
      setLoading(true);

      try {
        const response = await fetch("/api/slider?all=true");
        const payload = (await response.json()) as { slides?: HeroSlide[] };

        if (!cancelled && response.ok) {
          setSlides(payload.slides ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSlides();

    return () => {
      cancelled = true;
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function updateSlide(id: string, patch: Partial<HeroSlide>) {
    setSlides((prev) =>
      prev.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)),
    );
  }

  function moveSlide(id: string, direction: "up" | "down") {
    setSlides((prev) => {
      const index = prev.findIndex((slide) => slide.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return next.map((slide, slideIndex) => ({
        ...slide,
        sort_order: slideIndex + 1,
      }));
    });
  }

  function addSlide() {
    setSlides((prev) => [...prev, createEmptySlide(prev.length + 1)]);
    setEditingId(null);
  }

  function removeSlide(id: string) {
    if (!window.confirm(adminLabels.slider.deleteConfirm)) return;

    setSlides((prev) =>
      prev
        .filter((slide) => slide.id !== id)
        .map((slide, index) => ({ ...slide, sort_order: index + 1 })),
    );
    setEditingId((current) => (current === id ? null : current));
  }

  async function saveSlides() {
    setSaving(true);

    try {
      const response = await fetch("/api/slider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });

      if (!response.ok) {
        showToast(adminLabels.slider.errorSaving);
        return;
      }

      const payload = (await response.json()) as { slides?: HeroSlide[] };
      setSlides(payload.slides ?? slides);
      showToast(adminLabels.slider.saved);
    } catch {
      showToast(adminLabels.slider.errorSaving);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-400">{adminLabels.slider.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{adminLabels.slider.title}</h2>
          <p className="text-sm text-gray-500">
            {adminLabels.slider.subtitle}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={addSlide}
            className="w-full rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 sm:w-auto"
          >
            {adminLabels.slider.addSlide}
          </button>
          <button
            type="button"
            onClick={saveSlides}
            disabled={saving}
            className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60 sm:w-auto"
          >
            {saving ? adminLabels.saving : adminLabels.slider.saveSlider}
          </button>
        </div>
      </div>

      {toast ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-xl bg-green-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg sm:inset-x-auto sm:end-6 sm:bottom-6 sm:mx-0 sm:text-start">
          {toast}
        </div>
      ) : null}

      {slides.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-lg font-semibold text-gray-700">{adminLabels.slider.noSlides}</p>
          <button
            type="button"
            onClick={addSlide}
            className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
          >
            {adminLabels.slider.addFirstSlide}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, index) => {
            const isEditing = editingId === slide.id;

            return (
              <div
                key={slide.id}
                className={`overflow-hidden rounded-2xl border bg-white ${
                  slide.active ? "border-gray-200" : "border-gray-100 opacity-70"
                }`}
              >
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-amber-50 sm:w-48">
                    <Image
                      src={slide.image_url || "/assets/img1.jpeg"}
                      alt={slide.label_en}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="192px"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSlide(slide.id, { active: !slide.active })
                        }
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          slide.active
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {slide.active ? adminLabels.visible : adminLabels.hidden}
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          {adminLabels.fields.labelEnglish}
                        </label>
                        <input
                          type="text"
                          value={slide.label_en}
                          onChange={(event) =>
                            updateSlide(slide.id, { label_en: event.target.value })
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          {adminLabels.fields.labelArabic}
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={slide.label_ar}
                          onChange={(event) =>
                            updateSlide(slide.id, { label_ar: event.target.value })
                          }
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <p className="truncate text-xs text-gray-500">{slide.image_url}</p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveSlide(slide.id, "up")}
                        disabled={index === 0}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
                      >
                        {adminLabels.moveUp}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlide(slide.id, "down")}
                        disabled={index === slides.length - 1}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40"
                      >
                        {adminLabels.moveDown}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingId(isEditing ? null : slide.id)
                        }
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {isEditing ? adminLabels.closeImagePicker : adminLabels.changeImage}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSlide(slide.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                      >
                        {adminLabels.delete}
                      </button>
                    </div>

                    {isEditing ? (
                      <ImagePicker
                        label={adminLabels.slider.sliderImage}
                        value={slide.image_url}
                        onChange={(image_url) =>
                          updateSlide(slide.id, { image_url })
                        }
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
