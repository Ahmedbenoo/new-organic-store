import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type {
  CatalogProduct,
  Order,
  OrderItem,
  ProductCategory,
  ProductKind,
  ProductUnit,
  SiteSettings,
  StoreCategory,
} from "@/lib/types";

export { productCategories } from "@/data/products";

function normalizeSupabaseUrl(rawUrl?: string) {
  if (!rawUrl) return null;

  return rawUrl
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

function getSupabaseConfig() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return { url, anonKey, serviceRoleKey };
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
} as const;

let browserClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

export function createSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(url, anonKey, clientOptions);
}

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createSupabaseClient();
  }

  return browserClient;
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseConfig();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, clientOptions);
}

export function getSupabaseAdminClient() {
  if (!adminClient) {
    adminClient = createSupabaseAdminClient();
  }

  return adminClient;
}

export async function verifySupabaseConnection() {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    return {
      ok: false as const,
      message:
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false as const,
        message: `Supabase auth health check failed with status ${response.status}.`,
      };
    }

    return {
      ok: true as const,
      message: "Supabase connection successful.",
      url,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Supabase connection error";

    return {
      ok: false as const,
      message,
    };
  }
}

/** @deprecated Use getSupabaseBrowserClient() instead. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    return Reflect.get(getSupabaseBrowserClient(), property);
  },
});
