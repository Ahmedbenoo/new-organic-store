import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactForm from "@/components/contact/contact-form";
import PageHeader from "@/components/layout/page-header";
import AnimatedSection from "@/components/ui/animated-section";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Contact");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <AnimatedSection className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-dark/8 bg-white p-6">
              <h2 className="font-bold text-dark">{t("infoTitle")}</h2>
              <ul className="mt-4 space-y-4 text-sm text-muted">
                <li>
                  <span className="block font-medium text-dark">{t("emailLabel")}</span>
                  hello@organic-store.com
                </li>
                <li>
                  <span className="block font-medium text-dark">{t("phoneLabel")}</span>
                  01092313486
                </li>
                <li>
                  <span className="block font-medium text-dark">{t("hoursLabel")}</span>
                  {t("hours")}
                </li>
                <li>
                  <span className="block font-medium text-dark">{t("addressLabel")}</span>
                  {t("address")}
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-secondary/50 p-6">
              <h3 className="font-bold text-dark">{t("wholesaleTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t("wholesaleText")}
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={120} className="lg:col-span-3">
            <ContactForm />
          </AnimatedSection>
        </div>
      </div>
    </>
  );
}
