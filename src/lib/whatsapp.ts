export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;

  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  return `https://wa.me/${normalized}?text=${message}`;
}

export function openWhatsApp(url: string): boolean {
  const popup = window.open(url, "_blank", "noopener,noreferrer");

  if (popup) return true;

  window.location.assign(url);
  return false;
}
