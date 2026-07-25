import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/layout/page-header";
import { getBlogLocalizedField, readBlogPostBySlug } from "@/lib/blog-store";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: AppLocale; slug: string }>;
};

export const revalidate = 60;
export const dynamicParams = true;

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await readBlogPostBySlug(slug);
  if (!post) notFound();

  const common = await getTranslations("Common");
  const title = getBlogLocalizedField(post, "title", locale);
  const excerpt = getBlogLocalizedField(post, "excerpt", locale);
  const content = getBlogLocalizedField(post, "content", locale);
  const paragraphs = content.split(/\n\s*\n/).filter(Boolean);

  return (
    <>
      <PageHeader title={title} description={excerpt} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-3xl">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={post.image_url}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-muted">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString(locale)}
          </time>
          <span>·</span>
          <span>{common("minRead", { minutes: post.read_time })}</span>
          <span>·</span>
          <span aria-hidden="true">{post.emoji}</span>
        </div>

        <div className="space-y-5 text-base leading-8 text-muted">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)
          ) : (
            <p>{excerpt}</p>
          )}
        </div>

        <div className="mt-10 border-t border-dark/8 pt-6">
          <Link
            href="/blog"
            className="inline-flex text-sm font-semibold text-primary transition hover:text-primary-hover"
          >
            {locale === "ar" ? "← العودة للمدونة" : "← Back to blog"}
          </Link>
        </div>
      </div>
    </>
  );
}
