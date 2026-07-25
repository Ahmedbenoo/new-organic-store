import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PageHeader from "@/components/layout/page-header";
import AnimatedSection from "@/components/ui/animated-section";
import { getAboutLocalizedField, readAboutContent } from "@/lib/about-store";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: AppLocale }>;
};

export const revalidate = 60;

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("About");
  const content = await readAboutContent();

  const title =
    getAboutLocalizedField(content, "title", locale) || t("title");
  const description =
    getAboutLocalizedField(content, "description", locale) || t("description");
  const storyTitle =
    getAboutLocalizedField(content, "story_title", locale) || t("storyTitle");
  const storyP1 =
    getAboutLocalizedField(content, "story_p1", locale) || t("storyP1");
  const storyP2 =
    getAboutLocalizedField(content, "story_p2", locale) || t("storyP2");
  const valuesTitle =
    getAboutLocalizedField(content, "values_title", locale) || t("valuesTitle");
  const processTitle =
    getAboutLocalizedField(content, "process_title", locale) || t("processTitle");

  const values = ([1, 2, 3, 4] as const).map((index) => ({
    icon: content[`value${index}_icon`] || t(`value${index}Icon`),
    title:
      getAboutLocalizedField(content, `value${index}_title`, locale) ||
      t(`value${index}Title`),
    text:
      getAboutLocalizedField(content, `value${index}_text`, locale) ||
      t(`value${index}Text`),
  }));

  const steps = ([1, 2, 3] as const).map((index) => ({
    title:
      getAboutLocalizedField(content, `step${index}_title`, locale) ||
      t(`step${index}Title`),
    text:
      getAboutLocalizedField(content, `step${index}_text`, locale) ||
      t(`step${index}Text`),
  }));

  return (
    <>
      <PageHeader title={title} description={description} />

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <AnimatedSection>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-dark">{storyTitle}</h2>
              <p className="leading-8 text-muted">{storyP1}</p>
              <p className="leading-8 text-muted">{storyP2}</p>
            </div>
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-background shadow-inner ring-1 ring-dark/5">
              {content.story_image_url ? (
                <Image
                  src={content.story_image_url}
                  alt={storyTitle}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <span className="text-8xl">{content.story_emoji || "🐝"}</span>
              )}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <h2 className="text-center text-2xl font-bold text-dark">
            {valuesTitle}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="animate-card rounded-2xl border border-dark/8 bg-white p-6"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <span className="text-2xl">{value.icon}</span>
                <h3 className="mt-3 font-bold text-dark">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{value.text}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <h2 className="text-center text-2xl font-bold text-dark">
            {processTitle}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-dark/8 bg-background p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-bold text-dark">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </>
  );
}
