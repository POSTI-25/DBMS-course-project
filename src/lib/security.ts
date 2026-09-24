import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type Session = { userId: number; username: string; roleId: number };
const MAX_AGE = 60 * 60 * 8;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return value;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !hash || !/^[a-f0-9]{128}$/i.test(hash)) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeToken(session: Session) {
  const payload = Buffer.from(JSON.stringify({ ...session, expires: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function parseToken(token?: string): Session | null {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(signature(payload));
  const received = Buffer.from(mac);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!Number.isInteger(value.userId) || value.userId < 1 || typeof value.username !== "string" || !value.username || ![1, 2].includes(value.roleId) || typeof value.expires !== "number" || value.expires < Date.now()) return null;
    return { userId: value.userId, username: value.username, roleId: value.roleId };
  } catch { return null; }
}
