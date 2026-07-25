import type { ReactNode } from "react";

type SiteContainerProps = {
  children: ReactNode;
  className?: string;
};

export function SiteContainer({ children, className = "" }: SiteContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

export function SiteTwoColumnGrid({
  children,
  className = "",
}: SiteContainerProps) {
  return (
    <div
      className={`grid w-full grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 ${className}`}
    >
      {children}
    </div>
  );
}
