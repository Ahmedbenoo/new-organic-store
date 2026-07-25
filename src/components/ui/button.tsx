import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
};

const variants = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-md",
  secondary:
    "bg-secondary text-dark hover:bg-primary/20 hover:text-dark",
  ghost:
    "border border-dark/15 bg-white text-dark hover:border-primary hover:bg-secondary/40",
};

export default function Button({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-250 active:scale-[0.98] ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
