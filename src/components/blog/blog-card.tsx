"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getBlogImage } from "@/lib/product-images";
import type { BlogPost } from "@/data/blog-posts";

type BlogCardProps = {
  post: BlogPost;
};

export default function BlogCard({ post }: BlogCardProps) {
  const t = useTranslations("Blog");
  const common = useTranslations("Common");
  const locale = useLocale();

  return (
    <article className="animate-card overflow-hidden rounded-2xl border border-dark/8 bg-white">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-secondary to-background">
        <Image
          src={getBlogImage(post.id)}
          alt={t(`posts.${post.id}.title`)}
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
          <span>{common("minRead", { minutes: post.readTime })}</span>
        </div>
        <h3 className="text-lg font-bold text-dark">
          {t(`posts.${post.id}.title`)}
        </h3>
        <p className="text-sm leading-6 text-muted">
          {t(`posts.${post.id}.excerpt`)}
        </p>
        <Link
          href="/blog"
          className="inline-flex text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          {common("readMore")}
        </Link>
      </div>
    </article>
  );
}
