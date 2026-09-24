import pool from "@/lib/db";
import type { QueryConfig } from "pg";
import { requireApiSession } from "@/lib/session";

// Restrict access to sensitive PostgreSQL catalogs.
const BLOCKED = /\bpg_shadow\b|\bpg_authid\b/i;

export async function POST(req: Request) {
  const denied = await requireApiSession(true);
  if (denied) return denied;
  let body: { sql?: string };
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || (body.sql !== undefined && typeof body.sql !== "string"))
    return Response.json({ error: "Invalid request." }, { status: 400 });

  const sql = (body.sql ?? "").trim();
  if (!sql) return Response.json({ error: "No SQL provided." }, { status: 400 });
  if (BLOCKED.test(sql))
    return Response.json({ error: "Query references a restricted system catalog." }, { status: 403 });
  if (!/^(SELECT|WITH)\b/i.test(sql))
    return Response.json({ error: "Only read-only SELECT queries are supported here. Use the forms to edit records." }, { status: 400 });

  try {
    const start = Date.now();
    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SET LOCAL statement_timeout = '5s'");
      const boundedSql = `SELECT * FROM (${sql.replace(/;\s*$/, "")}) AS archive_result LIMIT 101`;
      const result = await client.query({ text: boundedSql, values: [], queryMode: "extended" } as QueryConfig);
      await client.query("COMMIT");
      return Response.json({
        success: true,
        rows: result.rows.slice(0, 100),
        rowCount: result.rowCount,
        command: result.command,
        queryTime: Date.now() - start,
        truncated: result.rows.length > 100,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  } catch (err: unknown) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
