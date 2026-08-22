import pool from "@/lib/db";

// Allowlist to prevent SQL injection through table names
const ALLOWED_TABLES = ["users", "celestial_bodies", "observations"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
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

    return Response.json({ columns: result.rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
