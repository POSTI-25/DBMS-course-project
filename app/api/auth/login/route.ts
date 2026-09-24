import pool from "@/lib/db";
import { setSession, verifyPassword } from "@/lib/session";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Invalid request." }, { status: 400 });
  const username = body.username?.trim();
  if (!username || !body.password) return Response.json({ error: "Enter a username and password." }, { status: 400 });
  try {
    const result = await pool.query("SELECT user_id, username, password_hash, role_id FROM users WHERE username = $1", [username]);
    const user = result.rows[0];
    if (!user || !verifyPassword(body.password, user.password_hash)) return Response.json({ error: "Invalid username or password." }, { status: 401 });
    await setSession({ userId: user.user_id, username: user.username, roleId: user.role_id });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Sign in is unavailable. Check the database and server configuration." }, { status: 503 });
  }
}
