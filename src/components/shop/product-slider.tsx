"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { products as fallbackProducts } from "@/data/products";
import { getProductImage } from "@/lib/product-images";
import type { HeroSlide } from "@/lib/types";

import Image from "next/image";

function buildFallbackSlides(): HeroSlide[] {
  const now = new Date().toISOString();

  return fallbackProducts.slice(0, 6).map((product, index) => ({
    id: product.id,
    image_url: getProductImage(product.id, product.category),
    label_en: product.id,
    label_ar: product.id,
    product_id: product.id,
    active: true,
    sort_order: index + 1,
    created_at: now,
    updated_at: now,
  }));
}

export default function ProductSlider() {
  const locale = useLocale();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSlides() {
      try {
        const response = await fetch("/api/slider");
        const payload = (await response.json()) as { slides?: HeroSlide[] };

        if (!cancelled && response.ok && payload.slides?.length) {
          setSlides(payload.slides);
          setCurrentIndex(0);
        } else if (!cancelled) {
          setSlides(buildFallbackSlides());
          setCurrentIndex(0);
        }
      } catch {
        if (!cancelled) {
          setSlides(buildFallbackSlides());
          setCurrentIndex(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSlides();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  function goToPrevious() {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  }

  function goToNext() {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  }

  if (loading) {
    return (
      <div className="relative mx-auto w-fit overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 p-1.5 shadow-2xl">
        <div className="relative w-96 animate-pulse p-2 sm:w-[26rem]">
          <div className="aspect-[4/5] w-full rounded-3xl bg-amber-200/60" />
        </div>
      </div>
    );
  }

  const activeIndex =
    slides.length === 0 ? 0 : Math.min(currentIndex, slides.length - 1);
  const activeSlide = slides[activeIndex];
  if (!activeSlide) return null;

  const slideLabel = locale === "ar" ? activeSlide.label_ar : activeSlide.label_en;

  return (
    <div className="relative mx-auto w-fit overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 p-1.5 shadow-2xl">
      <div className="absolute inset-0 opacity-20">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="honeycomb"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M20 0L40 10V30L20 40L0 30V10L20 0Z"
                fill="none"
                stroke="rgba(251,191,36,0.3)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#honeycomb)" />
        </svg>
      </div>

      <div className="relative w-96 p-2 sm:w-[26rem]">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-lg">
          <Image
            key={activeSlide.id}
            src={activeSlide.image_url}
            alt={slideLabel}
            fill
            priority={activeIndex === 0}
            className="scale-110 object-cover object-center"
            sizes="(max-width: 768px) 384px, 416px"
          />

          <div className="absolute inset-y-0 start-3 flex items-center sm:start-4">
            <button
              type="button"
              onClick={goToPrevious}
              className="flex size-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white sm:size-10"
              aria-label="Previous slide"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="absolute inset-y-0 end-3 flex items-center sm:end-4">
            <button
              type="button"
              onClick={goToNext}
              className="flex size-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white sm:size-10"
              aria-label="Next slide"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
