/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local', quiet: true });
require('dotenv').config({ path: '.env', quiet: true });
const { randomBytes, scryptSync } = require('node:crypto');
const { Pool } = require('pg');

if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) {
  console.error('Set ADMIN_PASSWORD to at least 12 characters before initializing.');
  process.exit(1);
}

const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'stellar_archive',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
});

function hash(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

async function init() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role_id INTEGER NOT NULL DEFAULT 2 CHECK (role_id IN (1, 2)),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS celestial_bodies (
      body_id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      spectral_type VARCHAR(20),
      mass DOUBLE PRECISION CHECK (mass >= 0),
      distance_ly DOUBLE PRECISION CHECK (distance_ly >= 0),
      constellation VARCHAR(100),
      discovered_at DATE
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS observations (
      obs_id SERIAL PRIMARY KEY,
      body_id INTEGER NOT NULL REFERENCES celestial_bodies(body_id) ON DELETE CASCADE,
      observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      notes TEXT,
      observer VARCHAR(100),
      instrument VARCHAR(150)
    )`);
    await client.query('CREATE INDEX IF NOT EXISTS observations_body_id_idx ON observations(body_id)');
    await client.query('CREATE INDEX IF NOT EXISTS observations_observed_at_idx ON observations(observed_at DESC)');
    await client.query(`INSERT INTO users (username, password_hash, role_id) VALUES ($1, $2, 1)
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = 1`,
      [process.env.ADMIN_USERNAME || 'admin', hash(process.env.ADMIN_PASSWORD)]);
    if (process.env.VIEWER_PASSWORD) {
      if (process.env.VIEWER_PASSWORD.length < 12) throw new Error('VIEWER_PASSWORD must be at least 12 characters.');
      await client.query(`INSERT INTO users (username, password_hash, role_id) VALUES ($1, $2, 2)
        ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = 2`,
        [process.env.VIEWER_USERNAME || 'viewer', hash(process.env.VIEWER_PASSWORD)]);
    }
    const bodyCount = await client.query('SELECT COUNT(*)::int AS count FROM celestial_bodies');
    if (bodyCount.rows[0].count === 0) {
      const bodies = [
        ['Sun', 'G2V', 1.9885e30, 0.0000158, null, null],
        ['Proxima Centauri', 'M5Ve', 2.446e29, 4.2441, 'Centaurus', '1915-01-01'],
        ['Sirius A', 'A1V', 4.018e30, 8.6, 'Canis Major', null],
        ['Betelgeuse', 'M2Iab', 2.283e31, 700, 'Orion', null],
        ['Vega', 'A0Va', 3.78e30, 25.04, 'Lyra', null],
        ['Rigel', 'B8Ia', 4.2e31, 864, 'Orion', null],
      ];
      for (const body of bodies) await client.query(
        'INSERT INTO celestial_bodies (name, spectral_type, mass, distance_ly, constellation, discovered_at) VALUES ($1,$2,$3,$4,$5,$6)', body);
    }
    const observationCount = await client.query('SELECT COUNT(*)::int AS count FROM observations');
    if (observationCount.rows[0].count === 0) {
      const sun = await client.query("SELECT body_id FROM celestial_bodies WHERE name = 'Sun' ORDER BY body_id LIMIT 1");
      if (sun.rows[0]) await client.query('INSERT INTO observations (body_id, notes, observer, instrument) VALUES ($1,$2,$3,$4)',
        [sun.rows[0].body_id, 'Baseline solar activity observation.', 'Archive team', 'Solar telescope']);
    }
    await client.query('COMMIT');
    console.log('Database ready. Sign in with the configured administrator account.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release(); await pool.end();
  }
}

init().catch(error => { console.error('Initialization failed:', error.message); process.exitCode = 1; });
