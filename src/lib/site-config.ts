import { getWhatsAppNumbers as readWhatsAppNumbers } from "@/lib/settings-store";

export async function getSiteWhatsAppNumbers() {
  return readWhatsAppNumbers();
}

export const siteConfig = {
  footerPhone: "01092313486",
  footerEmail: "hello@organic-store.com",
};
