"use client";

import { useEffect, useState } from "react";
import ImagePicker from "@/components/admin/image-picker";
import { adminLabels } from "@/lib/admin-labels";
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
    label: adminLabels.about.groups.header,
    icon: "📄",
    fields: [
      { key: "title_ar", label: adminLabels.fields.pageTitleArabic, bilingual: true },
      { key: "title_en", label: adminLabels.fields.pageTitleEnglish, bilingual: true },
      {
        key: "description_ar",
        label: adminLabels.fields.pageDescriptionArabic,
        type: "textarea",
        bilingual: true,
      },
      {
        key: "description_en",
        label: adminLabels.fields.pageDescriptionEnglish,
        type: "textarea",
        bilingual: true,
      },
    ],
  },
  {
    id: "story",
    label: adminLabels.about.groups.story,
    icon: "📖",
    fields: [
      { key: "story_title_ar", label: adminLabels.about.storyTitleArabic, bilingual: true },
      { key: "story_title_en", label: adminLabels.about.storyTitleEnglish, bilingual: true },
      { key: "story_p1_ar", label: adminLabels.about.storyP1Arabic, type: "textarea", bilingual: true },
      { key: "story_p1_en", label: adminLabels.about.storyP1English, type: "textarea", bilingual: true },
      { key: "story_p2_ar", label: adminLabels.about.storyP2Arabic, type: "textarea", bilingual: true },
      { key: "story_p2_en", label: adminLabels.about.storyP2English, type: "textarea", bilingual: true },
      { key: "story_emoji", label: adminLabels.about.storyEmojiHint, type: "emoji" },
    ],
  },
  {
    id: "values",
    label: adminLabels.about.groups.values,
    icon: "💎",
    fields: [
      { key: "values_title_ar", label: adminLabels.about.valuesTitleArabic, bilingual: true },
      { key: "values_title_en", label: adminLabels.about.valuesTitleEnglish, bilingual: true },
      { key: "value1_icon", label: adminLabels.about.valueIcon.replace("{n}", "1"), type: "emoji" },
      { key: "value1_title_ar", label: adminLabels.about.valueTitleArabic.replace("{n}", "1"), bilingual: true },
      { key: "value1_title_en", label: adminLabels.about.valueTitleEnglish.replace("{n}", "1"), bilingual: true },
      { key: "value1_text_ar", label: adminLabels.about.valueTextArabic.replace("{n}", "1"), type: "textarea", bilingual: true },
      { key: "value1_text_en", label: adminLabels.about.valueTextEnglish.replace("{n}", "1"), type: "textarea", bilingual: true },
      { key: "value2_icon", label: adminLabels.about.valueIcon.replace("{n}", "2"), type: "emoji" },
      { key: "value2_title_ar", label: adminLabels.about.valueTitleArabic.replace("{n}", "2"), bilingual: true },
      { key: "value2_title_en", label: adminLabels.about.valueTitleEnglish.replace("{n}", "2"), bilingual: true },
      { key: "value2_text_ar", label: adminLabels.about.valueTextArabic.replace("{n}", "2"), type: "textarea", bilingual: true },
      { key: "value2_text_en", label: adminLabels.about.valueTextEnglish.replace("{n}", "2"), type: "textarea", bilingual: true },
      { key: "value3_icon", label: adminLabels.about.valueIcon.replace("{n}", "3"), type: "emoji" },
      { key: "value3_title_ar", label: adminLabels.about.valueTitleArabic.replace("{n}", "3"), bilingual: true },
      { key: "value3_title_en", label: adminLabels.about.valueTitleEnglish.replace("{n}", "3"), bilingual: true },
      { key: "value3_text_ar", label: adminLabels.about.valueTextArabic.replace("{n}", "3"), type: "textarea", bilingual: true },
      { key: "value3_text_en", label: adminLabels.about.valueTextEnglish.replace("{n}", "3"), type: "textarea", bilingual: true },
      { key: "value4_icon", label: adminLabels.about.valueIcon.replace("{n}", "4"), type: "emoji" },
      { key: "value4_title_ar", label: adminLabels.about.valueTitleArabic.replace("{n}", "4"), bilingual: true },
      { key: "value4_title_en", label: adminLabels.about.valueTitleEnglish.replace("{n}", "4"), bilingual: true },
      { key: "value4_text_ar", label: adminLabels.about.valueTextArabic.replace("{n}", "4"), type: "textarea", bilingual: true },
      { key: "value4_text_en", label: adminLabels.about.valueTextEnglish.replace("{n}", "4"), type: "textarea", bilingual: true },
    ],
  },
  {
    id: "process",
    label: adminLabels.about.groups.process,
    icon: "⚙️",
    fields: [
      { key: "process_title_ar", label: adminLabels.about.processTitleArabic, bilingual: true },
      { key: "process_title_en", label: adminLabels.about.processTitleEnglish, bilingual: true },
      { key: "step1_title_ar", label: adminLabels.about.stepTitleArabic.replace("{n}", "1"), bilingual: true },
      { key: "step1_title_en", label: adminLabels.about.stepTitleEnglish.replace("{n}", "1"), bilingual: true },
      { key: "step1_text_ar", label: adminLabels.about.stepTextArabic.replace("{n}", "1"), type: "textarea", bilingual: true },
      { key: "step1_text_en", label: adminLabels.about.stepTextEnglish.replace("{n}", "1"), type: "textarea", bilingual: true },
      { key: "step2_title_ar", label: adminLabels.about.stepTitleArabic.replace("{n}", "2"), bilingual: true },
      { key: "step2_title_en", label: adminLabels.about.stepTitleEnglish.replace("{n}", "2"), bilingual: true },
      { key: "step2_text_ar", label: adminLabels.about.stepTextArabic.replace("{n}", "2"), type: "textarea", bilingual: true },
      { key: "step2_text_en", label: adminLabels.about.stepTextEnglish.replace("{n}", "2"), type: "textarea", bilingual: true },
      { key: "step3_title_ar", label: adminLabels.about.stepTitleArabic.replace("{n}", "3"), bilingual: true },
      { key: "step3_title_en", label: adminLabels.about.stepTitleEnglish.replace("{n}", "3"), bilingual: true },
      { key: "step3_text_ar", label: adminLabels.about.stepTextArabic.replace("{n}", "3"), type: "textarea", bilingual: true },
      { key: "step3_text_en", label: adminLabels.about.stepTextEnglish.replace("{n}", "3"), type: "textarea", bilingual: true },
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
        showToast(adminLabels.about.errorSaving);
        return;
      }

      const payload = (await response.json()) as { content?: AboutPageContent };
      setContent(payload.content ?? content);
      showToast(adminLabels.about.saved);
    } catch {
      showToast(adminLabels.about.errorSaving);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-400">{adminLabels.about.loading}</div>;
  }

  if (!content) {
    return <div className="py-12 text-center text-gray-400">{adminLabels.about.loadFailed}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{adminLabels.about.title}</h2>
          <p className="text-sm text-gray-500">
            {adminLabels.about.subtitle}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href="/ar/about"
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-600 transition hover:bg-gray-50 sm:w-auto"
          >
            {adminLabels.about.previewPage}
          </a>
          <button
            type="button"
            onClick={saveContent}
            disabled={saving}
            className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60 sm:w-auto"
          >
            {saving ? adminLabels.saving : adminLabels.about.saveAbout}
          </button>
        </div>
      </div>

      {toast ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-xl bg-green-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg sm:inset-x-auto sm:end-6 sm:bottom-6 sm:mx-0 sm:text-start">
          {toast}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <span>🖼️</span>
            <h3 className="text-sm font-semibold text-gray-700">{adminLabels.about.storyImage}</h3>
          </div>
        </div>
        <div className="p-5">
          <ImagePicker
            label={adminLabels.about.storySectionImage}
            value={content.story_image_url}
            onChange={(story_image_url) => updateField("story_image_url", story_image_url)}
          />
          <p className="mt-2 text-xs text-gray-500">
            {adminLabels.about.storyImageHint}
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
