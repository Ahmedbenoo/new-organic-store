import dynamic from "next/dynamic";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ProductCard from "@/components/shop/product-card";
import AnimatedSection from "@/components/ui/animated-section";
import Button from "@/components/ui/button";
import { SiteContainer , SiteTwoColumnGrid } from "@/components/layout/site-container";
import { readProducts } from "@/lib/products-store";
import { readPublicSettings } from "@/lib/settings-store";
import type { AppLocale } from "@/i18n/routing";

const ProductSlider = dynamic(
  () => import("@/components/shop/product-slider"),
  {
    loading: () => (
      <div className="mx-auto aspect-[4/5] w-full max-w-[26rem] animate-pulse rounded-3xl bg-secondary/50" />
    ),
  },
);

type Props = {
  params: Promise<{ locale: AppLocale }>;
};

export const revalidate = 60;

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const settings = await readPublicSettings();
  const catalog = await readProducts({ activeOnly: true });
  const featured = catalog.slice(0, 3);

  const heroBadge =
    locale === "ar" ? settings.hero_badge_ar : settings.hero_badge_en;
  const heroTitle =
    locale === "ar" ? settings.hero_title_ar : settings.hero_title_en;
  const heroDescription =
    locale === "ar"
      ? settings.hero_description_ar
      : settings.hero_description_en;

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--secondary)_0%,_transparent_50%)]"
        />
        <SiteContainer className="relative py-16 sm:py-20 lg:py-18">
          <SiteTwoColumnGrid className="lg:items-center">
          <div className="animate-fade-in-up space-y-6">
            <span className="inline-flex rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-dark">
              {heroBadge || t("badge")}
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-dark sm:text-5xl lg:text-6xl">
              {heroTitle || t("title")}
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted">
              {heroDescription || t("description")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/shop" variant="primary">
                {t("ctaPrimary")}
              </Button>
              <Button href="/about" variant="ghost">
                {t("ctaSecondary")}
              </Button>
            </div>
            <dl className="grid grid-cols-3 gap-4 pt-4">
              {(["stat1", "stat2", "stat3"] as const).map((key) => (
                <div key={key}>
                  <dt className="text-2xl font-bold text-primary">
                    {t(`${key}Value`)}
                  </dt>
                  <dd className="text-xs text-muted sm:text-sm">
                    {t(`${key}Label`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-scale-in relative mx-auto w-full min-w-0 max-w-[26rem] lg:max-w-none lg:justify-self-end">
            <ProductSlider />
          </div>
          </SiteTwoColumnGrid>
        </SiteContainer>
      </section>

      <section className="border-y border-dark/8 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-dark">{t("featuresTitle")}</h2>
            <p className="mt-3 text-muted">{t("featuresSubtitle")}</p>
          </AnimatedSection>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(["feature1", "feature2", "feature3", "feature4"] as const).map(
              (key, index) => (
                <AnimatedSection key={key} delay={index * 80}>
                  <div className="animate-card h-full rounded-2xl border border-dark/8 bg-background p-6">
                    <span className="text-3xl" aria-hidden="true">
                      {t(`${key}Icon`)}
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-dark">
                      {t(`${key}Title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {t(`${key}Text`)}
                    </p>
                  </div>
                </AnimatedSection>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold text-dark">
                {t("productsTitle")}
              </h2>
              <p className="mt-2 text-muted">{t("productsSubtitle")}</p>
            </div>
            <Button href="/shop" variant="ghost">
              {t("viewAll")}
            </Button>
          </AnimatedSection>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product, index) => (
              <AnimatedSection key={product.id} delay={index * 100}>
                <ProductCard productId={product.id} featured />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-dark py-16 text-secondary sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">
              {t("testimonialsTitle")}
            </h2>
          </AnimatedSection>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(["review1", "review2", "review3"] as const).map((key, index) => (
              <AnimatedSection key={key} delay={index * 100}>
                <blockquote className="animate-card h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <p className="text-sm leading-7 text-secondary/90">
                    &ldquo;{t(`${key}Text`)}&rdquo;
                  </p>
                  <footer className="mt-4 text-sm font-semibold text-primary">
                    {t(`${key}Author`)}
                  </footer>
                </blockquote>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <AnimatedSection className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-hover px-8 py-12 text-center text-white shadow-lg sm:px-12 sm:py-16">
            <h2 className="text-3xl font-bold">{t("bannerTitle")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/90">
              {t("bannerText")}
            </p>
            <Button
              href="/shop"
              variant="secondary"
              className="mt-8 bg-white text-dark hover:bg-secondary"
            >
              {t("bannerCta")}
            </Button>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}
