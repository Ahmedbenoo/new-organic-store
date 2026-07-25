"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { headerNavItems, type NavItem } from "@/config/navigation";

type NavLinksProps = {
  items?: NavItem[];
  onNavigate?: () => void;
  className?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
};

export default function NavLinks({
  items = headerNavItems,
  onNavigate,
  className = "",
  linkClassName = "",
  activeLinkClassName = "",
}: NavLinksProps) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  return (
    <ul className={className}>
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? activeLinkClassName || "font-semibold text-primary"
                  : linkClassName || "text-dark-muted transition hover:text-primary"
              }
            >
              {t(item.labelKey)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
