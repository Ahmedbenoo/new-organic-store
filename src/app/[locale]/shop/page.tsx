import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PageHeader from "@/components/layout/page-header";
import ShopGrid from "@/components/shop/shop-grid";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function ShopPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Shop");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="py-16 text-center text-muted">{t("loading")}</div>
          }
        >
          <ShopGrid />
        </Suspense>
      </div>
    </>
  );
}
