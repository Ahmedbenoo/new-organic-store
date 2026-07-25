const PHONE_KEY = "organic-store-customer-phone";
const ORDER_IDS_KEY = "organic-store-order-ids";

export function getSavedCustomerPhone(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PHONE_KEY) ?? "";
}

export function saveCustomerPhone(phone: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PHONE_KEY, phone.trim());
}

export function getSavedOrderIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(ORDER_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function rememberOrder(orderId: string, phone: string) {
  if (typeof window === "undefined") return;

  saveCustomerPhone(phone);

  const ids = getSavedOrderIds();
  if (!ids.includes(orderId)) {
    localStorage.setItem(ORDER_IDS_KEY, JSON.stringify([orderId, ...ids]));
  }
}

export function formatOrderNumber(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}
