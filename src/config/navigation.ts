export type NavItem = {
  href: "/" | "/shop" | "/orders" | "/about" | "/blog" | "/contact";
  labelKey: "home" | "shop" | "orders" | "about" | "blog" | "contact";
};

export const mainNavItems: NavItem[] = [
  { href: "/", labelKey: "home" },
  { href: "/shop", labelKey: "shop" },
  { href: "/orders", labelKey: "orders" },
  { href: "/about", labelKey: "about" },
  { href: "/blog", labelKey: "blog" },
  { href: "/contact", labelKey: "contact" },
];

export const headerNavItems: NavItem[] = mainNavItems;
