import { getTranslations, setRequestLocale } from "next-intl/server";
import PageHeader from "@/components/layout/page-header";
import MyOrders from "@/components/orders/my-orders";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function OrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Orders");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <MyOrders />
      </div>
    </>
  );
}
