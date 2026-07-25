import "server-only";

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (!isBcryptHash(hash)) {
    return false;
  }

  return bcrypt.compare(plain, hash);
}
