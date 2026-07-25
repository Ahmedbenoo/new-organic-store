"use client";

import { useState, useEffect } from "react";

const SETTING_GROUPS: {
  category: string;
  label: string;
  icon: string;
  keys: string[];
}[] = [
  {
    category: "contact",
    label: "WhatsApp & Contact",
    icon: "📱",
    keys: ["whatsapp_owner", "whatsapp_branch"],
  },
  {
    category: "hero",
    label: "Hero Section",
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
    label: "Footer",
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
    label: "Admin Password",
    icon: "🔒",
    keys: ["admin_password"],
  },
];

const SETTING_LABELS: Record<string, string> = {
  whatsapp_owner: "Owner WhatsApp Number (e.g. 201092313486)",
  whatsapp_branch: "Branch WhatsApp Number (e.g. 201092313486)",
  hero_badge_en: "Hero Badge (English)",
  hero_badge_ar: "Hero Badge (Arabic)",
  hero_title_en: "Hero Title (English)",
  hero_title_ar: "Hero Title (Arabic)",
  hero_description_en: "Hero Description (English)",
  hero_description_ar: "Hero Description (Arabic)",
  footer_email: "Footer Email",
  footer_phone: "Footer Phone",
  footer_address_en: "Footer Address (English)",
  footer_address_ar: "Footer Address (Arabic)",
  admin_password: "New Admin Password (leave blank to keep current)",
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
        showToast("Error saving settings");
        return;
      }

      setSettings((prev) => {
        const next = { ...prev };
        delete next.admin_password;
        return next;
      });
      showToast("Settings saved!");
    } catch {
      showToast("Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Site Settings</h2>
        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
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
                            ? "Leave blank to keep current password"
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
        <h3 className="font-semibold text-amber-800">What you can control here</h3>
        <p className="mt-2 text-sm text-amber-700">
          WhatsApp numbers, homepage hero text, footer contact details, and admin
          password. Changes apply to the live website immediately after saving.
        </p>
      </div>
    </div>
  );
}
