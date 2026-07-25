"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button";

export default function ContactForm() {
  const t = useTranslations("Contact");
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="animate-scale-in rounded-2xl border border-primary/20 bg-secondary/40 p-8 text-center">
        <span className="text-4xl" aria-hidden="true">
          ✉️
        </span>
        <h3 className="mt-4 text-xl font-bold text-dark">{t("successTitle")}</h3>
        <p className="mt-2 text-muted">{t("successMessage")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-fade-in-up space-y-5 rounded-2xl border border-dark/8 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-dark">{t("name")}</span>
          <input
            required
            type="text"
            className="w-full rounded-xl border border-dark/10 bg-background px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-dark">{t("email")}</span>
          <input
            required
            type="email"
            className="w-full rounded-xl border border-dark/10 bg-background px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-dark">{t("subject")}</span>
        <input
          required
          type="text"
          className="w-full rounded-xl border border-dark/10 bg-background px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-dark">{t("message")}</span>
        <textarea
          required
          rows={5}
          className="w-full resize-none rounded-xl border border-dark/10 bg-background px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <Button type="submit" variant="primary" className="w-full sm:w-auto">
        {t("submit")}
      </Button>
    </form>
  );
}
