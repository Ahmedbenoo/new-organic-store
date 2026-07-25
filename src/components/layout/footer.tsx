import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { mainNavItems } from "@/config/navigation";
import Logo from "@/components/layout/logo";
import { readPublicSettings } from "@/lib/settings-store";

type FooterProps = {
  locale: string;
};

export default async function Footer({ locale }: FooterProps) {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Navigation");
  const settings = await readPublicSettings();
  const year = new Date().getFullYear();

  const email = settings.footer_email ?? t("email");
  const phone = settings.footer_phone ?? t("phone");
  const address =
    locale === "ar"
      ? settings.footer_address_ar ?? t("address")
      : settings.footer_address_en ?? t("address");

  return (
    <footer className="border-t border-dark/10 bg-dark text-secondary/90">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4">
            <Logo variant="light" />
            <p className="max-w-sm text-sm leading-7 text-secondary/70">
              {t("description")}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("quickLinks")}
            </h2>
            <ul className="mt-4 space-y-3">
              {mainNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-secondary/70 transition hover:text-primary"
                  >
                    {nav(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("contactTitle")}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-secondary/70">
              <li>
                <a href={`mailto:${email}`} className="transition hover:text-primary">
                  {email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="transition hover:text-primary"
                >
                  {phone}
                </a>
              </li>
              <li>{address}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-secondary/50">
          <p>
            © {year} {nav("brandName")}. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
