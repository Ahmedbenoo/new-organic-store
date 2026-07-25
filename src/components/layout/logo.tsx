"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type LogoProps = {
  className?: string;
  variant?: "default" | "light";
};

export default function Logo({
  className = "",
  variant = "default",
}: LogoProps) {
  const t = useTranslations("Navigation");
  const src = variant === "light" ? "/logo-light.svg" : "/logo.svg";

  return (
    <Link
      href="/"
      className={`group block w-fit shrink-0 leading-none ${className}`}
      aria-label={t("brandName")}
    >
      <Image
        src={src}
        alt=""
        width={184}
        height={104}
        priority
        className="block h-12 w-auto transition-opacity duration-200 group-hover:opacity-90 sm:h-14 lg:h-[3.35rem]"
      />
    </Link>
  );
}
