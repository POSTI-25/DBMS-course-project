import { Pool } from 'pg';

// Next.js automatically loads .env.local — use DATABASE_URL when present,
// otherwise fall back to individual PG* environment variables.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'stellar_archive',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

export default pool;
