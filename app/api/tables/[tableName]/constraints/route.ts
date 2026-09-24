import pool from "@/lib/db";
import { requireApiSession } from "@/lib/session";

// Allowlist to prevent SQL injection through table names
const ALLOWED_TABLES = ["users", "celestial_bodies", "observations"];

export async function GET(
  _req: Request,
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
    const result = await pool.query(
      `SELECT
         column_name        AS "name",
         table_name         AS "table",
         column_default     AS "defaultValue",
         character_maximum_length AS "maximumLength",
         data_type          AS "type",
         is_nullable        AS "nullable",
         ordinal_position   AS "position"
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name   = $1
       ORDER BY ordinal_position`,
      [tableName]
    );
    const constraints = await pool.query(
      `SELECT c.conname AS name,
              CASE c.contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'f' THEN 'FOREIGN KEY'
                WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' ELSE c.contype::text END AS type,
              pg_get_constraintdef(c.oid) AS definition
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE n.nspname = 'public' AND t.relname = $1
       ORDER BY c.contype, c.conname`, [tableName]
    );

    return Response.json({ columns: result.rows, constraints: constraints.rows });
  } catch (err: unknown) {
    console.error("Schema query failed", err);
    return Response.json({ error: "Unable to load schema." }, { status: 500 });
  }
}
