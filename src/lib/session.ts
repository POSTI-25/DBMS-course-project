import { cookies } from "next/headers";
import { makeToken, parseToken } from "./security";
import type { Session } from "./security";

export { hashPassword, verifyPassword } from "./security";
export type { Session } from "./security";

const COOKIE = "stellar_session";
const MAX_AGE = 60 * 60 * 8;

export async function getSession() {
  return parseToken((await cookies()).get(COOKIE)?.value);
}

export async function setSession(session: Session) {
  (await cookies()).set(COOKIE, makeToken(session), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function requireApiSession(admin = false) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (admin && session.roleId !== 1) return Response.json({ error: "Administrator access required." }, { status: 403 });
  return null;
}
