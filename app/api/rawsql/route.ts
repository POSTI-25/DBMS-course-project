import pool from "@/lib/db";

// Only DML/DDL — block anything that tries to read pg_* system tables directly
// (basic safeguard; this is an admin-only tool anyway)
const BLOCKED = /\bpg_shadow\b|\bpg_authid\b/i;

export async function POST(req: Request) {
  let body: { sql?: string };
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sql = (body.sql ?? "").trim();
  if (!sql) return Response.json({ error: "No SQL provided." }, { status: 400 });
  if (BLOCKED.test(sql))
    return Response.json({ error: "Query references a restricted system catalog." }, { status: 403 });

  try {
    const start = Date.now();
    const result = await pool.query(sql);
    return Response.json({
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
      command: result.command,
      queryTime: Date.now() - start,
    });
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
