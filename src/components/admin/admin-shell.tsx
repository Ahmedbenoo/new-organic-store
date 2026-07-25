"use client";

import { useState } from "react";
import { useAdminAuth } from "@/context/admin-auth-context";
import AdminLogin from "@/components/admin/admin-login";
import AdminProducts from "@/components/admin/admin-products";
import AdminSettings from "@/components/admin/admin-settings";
import AdminOrders from "@/components/admin/admin-orders";
import AdminSlider from "@/components/admin/admin-slider";
import AdminAbout from "@/components/admin/admin-about";
import AdminBlog from "@/components/admin/admin-blog";

type Tab = "orders" | "products" | "slider" | "about" | "blog" | "settings";

export default function AdminShell() {
  const { isAuthenticated, logout, loading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Checking session...</div>;
  }

  if (!isAuthenticated) return <AdminLogin />;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "products", label: "Products", icon: "🍯" },
    { id: "slider", label: "Hero Slider", icon: "🖼️" },
    { id: "about", label: "About Page", icon: "📖" },
    { id: "blog", label: "Blog", icon: "✍️" },
    { id: "settings", label: "Site Settings", icon: "⚙️" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">🍯</span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                Organic Store
              </h1>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 sm:px-3 sm:text-sm"
            >
              <span className="hidden sm:inline">View Site</span>
              <span className="sm:hidden">Site</span>
            </a>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 sm:px-3 sm:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <label htmlFor="admin-tab-select" className="sr-only">
          Dashboard section
        </label>
        <select
          id="admin-tab-select"
          value={activeTab}
          onChange={(event) => setActiveTab(event.target.value as Tab)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.icon} {tab.label}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden border-b border-gray-200 bg-white md:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition lg:px-4 ${
                  activeTab === tab.id
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {activeTab === "orders" && <AdminOrders />}
          {activeTab === "products" && <AdminProducts />}
          {activeTab === "slider" && <AdminSlider />}
          {activeTab === "about" && <AdminAbout />}
          {activeTab === "blog" && <AdminBlog />}
          {activeTab === "settings" && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}
