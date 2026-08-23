import pool from "@/lib/db";

// ── Allowlists ──────────────────────────────────────────────────
const ALLOWED_TABLES = ["celestial_bodies", "observations"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

// Primary-key column per table
const PK: Record<AllowedTable, string> = {
  celestial_bodies: "body_id",
  observations: "obs_id",
};

// Columns that may be SET during an UPDATE (excludes PKs & serial cols)
const UPDATABLE_COLS: Record<AllowedTable, string[]> = {
  celestial_bodies: ["name", "spectral_type", "mass", "distance_ly", "constellation", "discovered_at"],
  observations:     ["body_id", "observed_at", "notes", "observer", "instrument"],
};

// Columns accepted during INSERT
const INSERTABLE_COLS: Record<AllowedTable, string[]> = {
  celestial_bodies: ["name", "spectral_type", "mass", "distance_ly", "constellation", "discovered_at"],
  observations:     ["body_id", "observed_at", "notes", "observer", "instrument"],
};

function isAllowed(t: string): t is AllowedTable {
  return (ALLOWED_TABLES as readonly string[]).includes(t);
}

// ── Helpers ─────────────────────────────────────────────────────
async function resolveParams(params: Promise<{ tableName: string }>) {
  return params;
}

// ── POST — INSERT ────────────────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const { tableName } = await resolveParams(params);
  if (!isAllowed(tableName))
    return Response.json({ error: `Inserts into "${tableName}" are not allowed.` }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const allowed = INSERTABLE_COLS[tableName];
  const cols = Object.keys(body).filter((k) => allowed.includes(k) && body[k] !== "" && body[k] !== null && body[k] !== undefined);

  if (cols.length === 0)
    return Response.json({ error: "No valid fields provided." }, { status: 400 });

  // Validate required: celestial_bodies.name | observations.body_id
  if (tableName === "celestial_bodies" && !body["name"])
    return Response.json({ error: "Field 'name' is required." }, { status: 400 });
  if (tableName === "observations" && !body["body_id"])
    return Response.json({ error: "Field 'body_id' is required." }, { status: 400 });

  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  const values = cols.map((c) => body[c]);
  const sql = `INSERT INTO "${tableName}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders}) RETURNING *`;

  try {
    const start = Date.now();
    const result = await pool.query(sql, values);
    return Response.json(
      { success: true, row: result.rows[0], rowsAffected: result.rowCount, queryTime: Date.now() - start },
      { status: 201 }
    );
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// ── PUT — UPDATE ─────────────────────────────────────────────────
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const { tableName } = await resolveParams(params);
  if (!isAllowed(tableName))
    return Response.json({ error: `Updates on "${tableName}" are not allowed.` }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const pkCol  = PK[tableName];
  const pkVal  = body[pkCol];
  if (pkVal === undefined || pkVal === null || pkVal === "")
    return Response.json({ error: `Primary key "${pkCol}" is required.` }, { status: 400 });

  const allowed = UPDATABLE_COLS[tableName];
  const setCols = Object.keys(body).filter(
    (k) => k !== pkCol && allowed.includes(k) && body[k] !== undefined
  );

  if (setCols.length === 0)
    return Response.json({ error: "No updatable fields provided." }, { status: 400 });

  const setClause = setCols.map((c, i) => `"${c}" = $${i + 1}`).join(", ");
  const values    = [...setCols.map((c) => body[c] === "" ? null : body[c]), pkVal];
  const sql       = `UPDATE "${tableName}" SET ${setClause} WHERE "${pkCol}" = $${setCols.length + 1} RETURNING *`;

  try {
    const start = Date.now();
    const result = await pool.query(sql, values);
    if (result.rowCount === 0)
      return Response.json({ error: `No record found with ${pkCol} = ${pkVal}.` }, { status: 404 });
    return Response.json(
      { success: true, row: result.rows[0], rowsAffected: result.rowCount, queryTime: Date.now() - start }
    );
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const { tableName } = await resolveParams(params);
  if (!isAllowed(tableName))
    return Response.json({ error: `Deletes on "${tableName}" are not allowed.` }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const pkCol = PK[tableName];
  const pkVal = body[pkCol];
  if (pkVal === undefined || pkVal === null || pkVal === "")
    return Response.json({ error: `Primary key "${pkCol}" is required.` }, { status: 400 });

  const sql = `DELETE FROM "${tableName}" WHERE "${pkCol}" = $1 RETURNING *`;

  try {
    const start = Date.now();
    const result = await pool.query(sql, [pkVal]);
    if (result.rowCount === 0)
      return Response.json({ error: `No record found with ${pkCol} = ${pkVal}.` }, { status: 404 });
    return Response.json(
      { success: true, row: result.rows[0], rowsAffected: result.rowCount, queryTime: Date.now() - start }
    );
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
