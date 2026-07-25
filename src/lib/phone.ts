export function normalizePhoneForLookup(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("20")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);

  return digits;
}

export function phonesMatch(a: string, b: string): boolean {
  const left = normalizePhoneForLookup(a);
  const right = normalizePhoneForLookup(b);

  if (!left || !right) return false;
  return left === right;
}
