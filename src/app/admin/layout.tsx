import type { ReactNode } from "react";
import "@/app/globals.css";
import { Geist } from "next/font/google";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata = {
  title: "Admin Dashboard | Organic Store",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
