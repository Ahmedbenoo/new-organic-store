"use client";

import { useEffect, useState } from "react";
import ImagePicker from "@/components/admin/image-picker";
import type { AboutPageContent } from "@/lib/types";

type FieldGroup = {
  id: string;
  label: string;
  icon: string;
  fields: {
    key: keyof AboutPageContent;
    label: string;
    type?: "text" | "textarea" | "emoji";
    bilingual?: boolean;
  }[];
};

const FIELD_GROUPS: FieldGroup[] = [
  {
    id: "header",
    label: "Page Header",
    icon: "📄",
    fields: [
      { key: "title_ar", label: "Page title (Arabic)", bilingual: true },
      { key: "title_en", label: "Page title (English)", bilingual: true },
      {
        key: "description_ar",
        label: "Page description (Arabic)",
        type: "textarea",
        bilingual: true,
      },
      {
        key: "description_en",
        label: "Page description (English)",
        type: "textarea",
        bilingual: true,
      },
    ],
  },
  {
    id: "story",
    label: "Story Section",
    icon: "📖",
    fields: [
      { key: "story_title_ar", label: "Story title (Arabic)", bilingual: true },
      { key: "story_title_en", label: "Story title (English)", bilingual: true },
      { key: "story_p1_ar", label: "Story paragraph 1 (Arabic)", type: "textarea", bilingual: true },
      { key: "story_p1_en", label: "Story paragraph 1 (English)", type: "textarea", bilingual: true },
      { key: "story_p2_ar", label: "Story paragraph 2 (Arabic)", type: "textarea", bilingual: true },
      { key: "story_p2_en", label: "Story paragraph 2 (English)", type: "textarea", bilingual: true },
      { key: "story_emoji", label: "Story emoji (shown if no image)", type: "emoji" },
    ],
  },
  {
    id: "values",
    label: "Values Section",
    icon: "💎",
    fields: [
      { key: "values_title_ar", label: "Values title (Arabic)", bilingual: true },
      { key: "values_title_en", label: "Values title (English)", bilingual: true },
      { key: "value1_icon", label: "Value 1 icon", type: "emoji" },
      { key: "value1_title_ar", label: "Value 1 title (Arabic)", bilingual: true },
      { key: "value1_title_en", label: "Value 1 title (English)", bilingual: true },
      { key: "value1_text_ar", label: "Value 1 text (Arabic)", type: "textarea", bilingual: true },
      { key: "value1_text_en", label: "Value 1 text (English)", type: "textarea", bilingual: true },
      { key: "value2_icon", label: "Value 2 icon", type: "emoji" },
      { key: "value2_title_ar", label: "Value 2 title (Arabic)", bilingual: true },
      { key: "value2_title_en", label: "Value 2 title (English)", bilingual: true },
      { key: "value2_text_ar", label: "Value 2 text (Arabic)", type: "textarea", bilingual: true },
      { key: "value2_text_en", label: "Value 2 text (English)", type: "textarea", bilingual: true },
      { key: "value3_icon", label: "Value 3 icon", type: "emoji" },
      { key: "value3_title_ar", label: "Value 3 title (Arabic)", bilingual: true },
      { key: "value3_title_en", label: "Value 3 title (English)", bilingual: true },
      { key: "value3_text_ar", label: "Value 3 text (Arabic)", type: "textarea", bilingual: true },
      { key: "value3_text_en", label: "Value 3 text (English)", type: "textarea", bilingual: true },
      { key: "value4_icon", label: "Value 4 icon", type: "emoji" },
      { key: "value4_title_ar", label: "Value 4 title (Arabic)", bilingual: true },
      { key: "value4_title_en", label: "Value 4 title (English)", bilingual: true },
      { key: "value4_text_ar", label: "Value 4 text (Arabic)", type: "textarea", bilingual: true },
      { key: "value4_text_en", label: "Value 4 text (English)", type: "textarea", bilingual: true },
    ],
  },
  {
    id: "process",
    label: "Process Section",
    icon: "⚙️",
    fields: [
      { key: "process_title_ar", label: "Process title (Arabic)", bilingual: true },
      { key: "process_title_en", label: "Process title (English)", bilingual: true },
      { key: "step1_title_ar", label: "Step 1 title (Arabic)", bilingual: true },
      { key: "step1_title_en", label: "Step 1 title (English)", bilingual: true },
      { key: "step1_text_ar", label: "Step 1 text (Arabic)", type: "textarea", bilingual: true },
      { key: "step1_text_en", label: "Step 1 text (English)", type: "textarea", bilingual: true },
      { key: "step2_title_ar", label: "Step 2 title (Arabic)", bilingual: true },
      { key: "step2_title_en", label: "Step 2 title (English)", bilingual: true },
      { key: "step2_text_ar", label: "Step 2 text (Arabic)", type: "textarea", bilingual: true },
      { key: "step2_text_en", label: "Step 2 text (English)", type: "textarea", bilingual: true },
      { key: "step3_title_ar", label: "Step 3 title (Arabic)", bilingual: true },
      { key: "step3_title_en", label: "Step 3 title (English)", bilingual: true },
      { key: "step3_text_ar", label: "Step 3 text (Arabic)", type: "textarea", bilingual: true },
      { key: "step3_text_en", label: "Step 3 text (English)", type: "textarea", bilingual: true },
    ],
  },
];

export default function AdminAbout() {
  const [content, setContent] = useState<AboutPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadContent() {
      try {
        const response = await fetch("/api/about");
        const payload = (await response.json()) as { content?: AboutPageContent };

        if (!cancelled && response.ok) {
          setContent(payload.content ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadContent();

    return () => {
      cancelled = true;
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  function updateField(key: keyof AboutPageContent, value: string) {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function saveContent() {
    if (!content) return;
    setSaving(true);

    try {
      const response = await fetch("/api/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        showToast("Error saving about page");
        return;
      }

      const payload = (await response.json()) as { content?: AboutPageContent };
      setContent(payload.content ?? content);
      showToast("About page saved!");
    } catch {
      showToast("Error saving about page");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading about page...</div>;
  }

  if (!content) {
    return <div className="py-12 text-center text-gray-400">Failed to load about page.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">About Page</h2>
          <p className="text-sm text-gray-500">
            Edit every element on the About Us page in Arabic and English.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/ar/about"
            target="_blank"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Preview page
          </a>
          <button
            type="button"
            onClick={saveContent}
            disabled={saving}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save About Page"}
          </button>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <span>🖼️</span>
            <h3 className="text-sm font-semibold text-gray-700">Story image</h3>
          </div>
        </div>
        <div className="p-5">
          <ImagePicker
            label="Story section image"
            value={content.story_image_url}
            onChange={(story_image_url) => updateField("story_image_url", story_image_url)}
          />
          <p className="mt-2 text-xs text-gray-500">
            If empty, the emoji below will be shown instead.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {FIELD_GROUPS.map((group) => (
          <div
            key={group.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
          >
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3">
              <span>{group.icon}</span>
              <h3 className="text-sm font-semibold text-gray-700">{group.label}</h3>
            </div>
            <div className="space-y-4 p-5">
              {group.fields.map((field) => {
                const isArabic = field.key.endsWith("_ar");
                const value = String(content[field.key] ?? "");

                if (field.type === "textarea") {
                  return (
                    <div key={field.key}>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <textarea
                        rows={3}
                        dir={isArabic ? "rtl" : "ltr"}
                        value={value}
                        onChange={(event) => updateField(field.key, event.target.value)}
                        className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      dir={isArabic ? "rtl" : "ltr"}
                      value={value}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
