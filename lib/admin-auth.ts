import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "admin_session";

type SessionPayload = {
  user: string;
  exp: number;
};

const getSecret = () => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET");
  }
  return secret;
};

const base64Url = (value: string) =>
  Buffer.from(value).toString("base64url");

const sign = (value: string) => {
  const secret = getSecret();
  return createHmac("sha256", secret).update(value).digest("base64url");
};

export function createSession(user: string, ttlHours = 24) {
  const payload: SessionPayload = {
    user,
    exp: Date.now() + ttlHours * 60 * 60 * 1000,
  };
  const encoded = base64Url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySession(token: string | undefined) {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieName() {
  return COOKIE_NAME;
}

export function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const N = 16384;
  const r = 8;
  const p = 1;
  const keylen = 64;
  const key = scryptSync(password, salt, keylen, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt}$${key.toString("base64url")}`;
}

export async function verifyAdminPassword(password: string, storedHash: string) {
  if (!storedHash) return false;

  if (!storedHash.startsWith("scrypt$")) {
    return safeEqual(password, storedHash);
  }

  const parts = storedHash.split("$");
  if (parts.length !== 6) return false;

  const [, nRaw, rRaw, pRaw, salt, expectedHash] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const derived = scryptSync(password, salt, 64, { N, r, p });
  const expected = Buffer.from(expectedHash, "base64url");

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
