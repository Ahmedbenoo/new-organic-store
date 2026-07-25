import "server-only";

import { revalidatePath } from "next/cache";
import { routing } from "@/i18n/routing";

function localizedPath(locale: string, ...segments: string[]) {
  const suffix = segments.length > 0 ? `/${segments.join("/")}` : "";
  return `/${locale}${suffix}`;
}

function forEachLocale(run: (locale: string) => void) {
  for (const locale of routing.locales) {
    run(locale);
  }
}

export function revalidateBlogPages(slugs: string[] = []) {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];

  forEachLocale((locale) => {
    revalidatePath(localizedPath(locale, "blog"));

    for (const slug of uniqueSlugs) {
      revalidatePath(localizedPath(locale, "blog", slug));
    }
  });
}

export function revalidateProductPages() {
  forEachLocale((locale) => {
    revalidatePath(localizedPath(locale), "layout");
    revalidatePath(localizedPath(locale));
    revalidatePath(localizedPath(locale, "shop"));
  });
}

export function revalidateSliderPages() {
  forEachLocale((locale) => {
    revalidatePath(localizedPath(locale));
  });
}

export function revalidateAboutPages() {
  forEachLocale((locale) => {
    revalidatePath(localizedPath(locale, "about"));
  });
}

export function revalidateSettingsPages() {
  forEachLocale((locale) => {
    revalidatePath(localizedPath(locale), "layout");
    revalidatePath(localizedPath(locale));
  });
}
