"use client";

import { useState, useEffect } from "react";
import { adminLabels } from "@/lib/admin-labels";

const SETTING_GROUPS: {
  category: string;
  label: string;
  icon: string;
  keys: string[];
}[] = [
  {
    category: "contact",
    label: adminLabels.settings.groups.contact,
    icon: "📱",
    keys: ["whatsapp_owner", "whatsapp_branch"],
  },
  {
    category: "hero",
    label: adminLabels.settings.groups.hero,
    icon: "🌟",
    keys: [
      "hero_badge_en",
      "hero_badge_ar",
      "hero_title_en",
      "hero_title_ar",
      "hero_description_en",
      "hero_description_ar",
    ],
  },
  {
    category: "footer",
    label: adminLabels.settings.groups.footer,
    icon: "📄",
    keys: [
      "footer_email",
      "footer_phone",
      "footer_address_en",
      "footer_address_ar",
    ],
  },
  {
    category: "admin",
    label: adminLabels.settings.groups.admin,
    icon: "🔒",
    keys: ["admin_password"],
  },
];

const SETTING_LABELS: Record<string, string> = {
  whatsapp_owner: adminLabels.settings.whatsappOwner,
  whatsapp_branch: adminLabels.settings.whatsappBranch,
  hero_badge_en: adminLabels.settings.heroBadgeEnglish,
  hero_badge_ar: adminLabels.settings.heroBadgeArabic,
  hero_title_en: adminLabels.settings.heroTitleEnglish,
  hero_title_ar: adminLabels.settings.heroTitleArabic,
  hero_description_en: adminLabels.settings.heroDescriptionEnglish,
  hero_description_ar: adminLabels.settings.heroDescriptionArabic,
  footer_email: adminLabels.settings.footerEmail,
  footer_phone: adminLabels.settings.footerPhone,
  footer_address_en: adminLabels.settings.footerAddressEnglish,
  footer_address_ar: adminLabels.settings.footerAddressArabic,
  admin_password: adminLabels.settings.adminPassword,
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch("/api/settings?scope=admin");
        const payload = (await response.json()) as {
          settings?: Record<string, string>;
        };

        if (!cancelled && response.ok) {
          setSettings(payload.settings ?? {});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  async function saveAll() {
    setSaving(true);

    try {
      const payload = { ...settings };
      if (!payload.admin_password?.trim()) {
        delete payload.admin_password;
      }

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        showToast(adminLabels.settings.errorSaving);
        return;
      }

      setSettings((prev) => {
        const next = { ...prev };
        delete next.admin_password;
        return next;
      });
      showToast(adminLabels.settings.saved);
    } catch {
      showToast(adminLabels.settings.errorSaving);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-400">{adminLabels.settings.loading}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">{adminLabels.settings.title}</h2>
        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="w-full rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60 sm:w-auto"
        >
          {saving ? adminLabels.saving : adminLabels.settings.saveAll}
        </button>
      </div>

      {toast ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-xl bg-green-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg sm:inset-x-auto sm:end-6 sm:bottom-6 sm:mx-0 sm:text-start">
          {toast}
        </div>
      ) : null}

      <div className="space-y-6">
        {SETTING_GROUPS.map((group) => (
          <div
            key={group.category}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
          >
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3">
              <span>{group.icon}</span>
              <h3 className="text-sm font-semibold text-gray-700">{group.label}</h3>
            </div>
            <div className="space-y-4 p-5">
              {group.keys.map((key) => {
                const isArabic = key.endsWith("_ar");
                const isTextarea =
                  key.includes("description") || key.includes("title");

                return (
                  <div key={key}>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      {SETTING_LABELS[key] ?? key}
                    </label>
                    {isTextarea ? (
                      <textarea
                        rows={3}
                        dir={isArabic ? "rtl" : "ltr"}
                        value={settings[key] ?? ""}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            [key]: event.target.value,
                          }))
                        }
                        className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                      />
                    ) : (
                      <input
                        type={key === "admin_password" ? "password" : "text"}
                        dir={isArabic ? "rtl" : "ltr"}
                        value={settings[key] ?? ""}
                        placeholder={
                          key === "admin_password"
                            ? adminLabels.settings.passwordPlaceholder
                            : undefined
                        }
                        autoComplete={
                          key === "admin_password" ? "new-password" : undefined
                        }
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            [key]: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="font-semibold text-amber-800">{adminLabels.settings.infoTitle}</h3>
        <p className="mt-2 text-sm text-amber-700">
          {adminLabels.settings.infoText}
        </p>
      </div>
    </div>
  );
}
