import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/layout/page-header";
import AnimatedSection from "@/components/ui/animated-section";
import {
  getBlogLocalizedField,
  getBlogSettingsField,
  readBlogData,
} from "@/lib/blog-store";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: AppLocale }>;
};

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Blog");
  const common = await getTranslations("Common");
  const { settings, posts } = await readBlogData({ activeOnly: true });

  const title = getBlogSettingsField(settings, "title", locale) || t("title");
  const description =
    getBlogSettingsField(settings, "description", locale) || t("description");

  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <p className="text-center text-muted">No blog posts yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => {
              const postTitle = getBlogLocalizedField(post, "title", locale);
              const postExcerpt = getBlogLocalizedField(post, "excerpt", locale);

              return (
                <AnimatedSection key={post.id} delay={index * 100}>
                  <article className="animate-card overflow-hidden rounded-2xl border border-dark/8 bg-white">
                    <div className="relative h-40 overflow-hidden bg-gradient-to-br from-secondary to-background">
                      <Image
                        src={post.image_url}
                        alt={postTitle}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="space-y-3 p-5">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString(locale)}
                        </time>
                        <span>·</span>
                        <span>{common("minRead", { minutes: post.read_time })}</span>
                      </div>
                      <h3 className="text-lg font-bold text-dark">{postTitle}</h3>
                      <p className="text-sm leading-6 text-muted">{postExcerpt}</p>
                      <Link
                        href={`/blog/${post.id}`}
                        className="inline-flex text-sm font-semibold text-primary transition hover:text-primary-hover"
                      >
                        {common("readMore")}
                      </Link>
                    </div>
                  </article>
                </AnimatedSection>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
