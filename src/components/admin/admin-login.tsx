"use client";

import { useState } from "react";
import { useAdminAuth } from "@/context/admin-auth-context";

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const ok = await login(password);

    if (!ok) {
      setError("Incorrect password. Default password is: admin123");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-8 py-8 text-center">
            <span className="text-5xl">🍯</span>
            <h1 className="mt-3 text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-white/80">Organic Store Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-8">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 py-3 font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
