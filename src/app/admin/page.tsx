"use client";

import { AdminAuthProvider } from "@/context/admin-auth-context";
import AdminShell from "@/components/admin/admin-shell";

export default function AdminPage() {
  return (
    <AdminAuthProvider>
      <AdminShell />
    </AdminAuthProvider>
  );
}
