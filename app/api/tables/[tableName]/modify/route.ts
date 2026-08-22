import pool from "@/lib/db";

const ALLOWED_TABLES = ["celestial_bodies", "observations"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const { tableName } = await params;

  if (!ALLOWED_TABLES.includes(tableName)) {
    return Response.json(
      { error: `Inserts into table "${tableName}" are not allowed.` },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    if (tableName === "celestial_bodies") {
      const { name, spectral_type, mass, distance_ly, constellation, discovered_at } = body as {
        name: string;
        spectral_type?: string;
        mass?: number;
        distance_ly?: number;
        constellation?: string;
        discovered_at?: string;
      };

      if (!name || String(name).trim() === "") {
        return Response.json({ error: "Field 'name' is required." }, { status: 400 });
      }

      const result = await pool.query(
        `INSERT INTO celestial_bodies (name, spectral_type, mass, distance_ly, constellation, discovered_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          name,
          spectral_type || null,
          mass || null,
          distance_ly || null,
          constellation || null,
          discovered_at || null,
        ]
      );

      return Response.json({ success: true, row: result.rows[0] }, { status: 201 });
    }

    if (tableName === "observations") {
      const { body_id, observed_at, notes, observer, instrument } = body as {
        body_id: number;
        observed_at?: string;
        notes?: string;
        observer?: string;
        instrument?: string;
      };

      if (!body_id) {
        return Response.json({ error: "Field 'body_id' is required." }, { status: 400 });
      }

      const result = await pool.query(
        `INSERT INTO observations (body_id, observed_at, notes, observer, instrument)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          body_id,
          observed_at || new Date().toISOString(),
          notes || null,
          observer || null,
          instrument || null,
        ]
      );

      return Response.json({ success: true, row: result.rows[0] }, { status: 201 });
    }

    return Response.json({ error: "Unsupported table." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
