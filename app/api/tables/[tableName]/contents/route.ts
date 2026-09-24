import pool from "@/lib/db";
import { requireApiSession } from "@/lib/session";

const ALLOWED_TABLES = ["users", "celestial_bodies", "observations"];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const denied = await requireApiSession();
  if (denied) return denied;
  const { tableName } = await params;

  if (!ALLOWED_TABLES.includes(tableName)) {
    return Response.json(
      { error: `Table "${tableName}" is not allowed or does not exist.` },
      { status: 400 }
    );
  }

  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Number(url.searchParams.get("pageSize") || 25);
    const idValue = url.searchParams.get("id");
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)
      return Response.json({ error: "Invalid pagination parameters." }, { status: 400 });
    const count = await pool.query(`SELECT COUNT(*)::int AS count FROM "${tableName}"`);
    const pk = tableName === "users" ? "user_id" : tableName === "observations" ? "obs_id" : "body_id";
    const fields = tableName === "users" ? 'user_id, username, role_id, created_at' : '*';
    if (idValue !== null) {
      const id = Number(idValue);
      if (!Number.isSafeInteger(id) || id < 1) return Response.json({ error: "Invalid record ID." }, { status: 400 });
      const one = await pool.query(`SELECT ${fields} FROM "${tableName}" WHERE "${pk}" = $1`, [id]);
      return Response.json({ rows: one.rows, count: one.rowCount, page: 1, pageSize: 1 });
    }
    const result = await pool.query(`SELECT ${fields} FROM "${tableName}" ORDER BY "${pk}" LIMIT $1 OFFSET $2`, [pageSize, (page - 1) * pageSize]);
    return Response.json({ rows: result.rows, count: count.rows[0].count, page, pageSize });
  } catch (err: unknown) {
    console.error("Contents query failed", err);
    return Response.json({ error: "Unable to load table data." }, { status: 500 });
  }
}
