import pool from "@/lib/db";

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
    // Using identifier quoting via pg to safely reference the table name
    const result = await pool.query(`SELECT * FROM "${tableName}" LIMIT 500`);
    return Response.json({ rows: result.rows, count: result.rowCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
