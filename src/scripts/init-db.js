// src/scripts/init-db.js
// Run with: node src/scripts/init-db.js

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // fallback

const { Pool } = require('pg');

// Use DATABASE_URL if present, otherwise fall back to individual PG* vars
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'stellar_archive',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
    });

async function init() {
  const client = await pool.connect();
  try {
    console.log('Connected to database. Initializing schema...');

    // Drop in reverse dependency order so FK constraints don't block drops
    await client.query('DROP TABLE IF EXISTS observations CASCADE;');
    await client.query('DROP TABLE IF EXISTS celestial_bodies CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');

    await client.query(`
      CREATE TABLE users (
        user_id   SERIAL PRIMARY KEY,
        username  VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role_id   INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE celestial_bodies (
        body_id       SERIAL PRIMARY KEY,
        name          VARCHAR(150) NOT NULL,
        spectral_type VARCHAR(20),
        mass          DOUBLE PRECISION,
        distance_ly   DOUBLE PRECISION,
        constellation VARCHAR(100),
        discovered_at DATE
      );
    `);

    await client.query(`
      CREATE TABLE observations (
        obs_id      SERIAL PRIMARY KEY,
        body_id     INTEGER NOT NULL REFERENCES celestial_bodies(body_id) ON DELETE CASCADE,
        observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        notes       TEXT,
        observer    VARCHAR(100),
        instrument  VARCHAR(150)
      );
    `);

    console.log('Tables created. Seeding data...');

    // Seed Users
    await client.query(`
      INSERT INTO users (username, password_hash, role_id) VALUES
        ('admin',   '$2b$10$adminHashPlaceholder',   1),
        ('viewer1', '$2b$10$viewerHashPlaceholder1', 2),
        ('viewer2', '$2b$10$viewerHashPlaceholder2', 2),
        ('analyst', '$2b$10$analystHashPlaceholder', 2),
        ('guest',   '$2b$10$guestHashPlaceholder',   2),
        ('jsmith',  '$2b$10$jsmithHashPlaceholder',  2),
        ('jdoe',    '$2b$10$jdoeHashPlaceholder',    2)
      ON CONFLICT (username) DO NOTHING;
    `);

    // Seed Celestial Bodies
    await client.query(`
      INSERT INTO celestial_bodies (name, spectral_type, mass, distance_ly, constellation, discovered_at) VALUES
        ('Sun',           'G2V',  1.9885e30, 0.0000158,  'N/A',       '1543-01-01'),
        ('Proxima Centauri','M5Ve',2.4460e29, 4.2441,    'Centaurus', '1915-01-01'),
        ('Sirius A',      'A1V',  4.0180e30, 8.6,       'Canis Major','1844-01-01'),
        ('Betelgeuse',    'M2Iab',2.2830e31, 700,       'Orion',     '1839-01-01'),
        ('Vega',          'A0Va', 3.7800e30, 25.04,     'Lyra',      '1850-01-01'),
        ('Andromeda Galaxy','SBb', NULL,      2537000,   'Andromeda', '964-01-01'),
        ('Rigel',         'B8Ia', 4.2000e31, 864,       'Orion',     '1872-01-01'),
        ('Polaris',       'F7Ib', 1.4200e31, 433,       'Ursa Minor','1884-01-01')
      ON CONFLICT DO NOTHING;
    `);

    // Seed Observations
    await client.query(`
      INSERT INTO observations (body_id, observed_at, notes, observer, instrument) VALUES
        (1, '2025-01-15 08:30:00+00', 'Regular solar activity monitoring. Sunspot count elevated.', 'Dr. Chen', 'Solar Telescope T-1'),
        (2, '2025-02-20 22:10:00+00', 'Flare event detected. Spectral shift recorded.', 'Dr. Patel', 'Spectrometer X-7'),
        (3, '2025-03-05 21:45:00+00', 'Binary companion Sirius B partially visible.', 'J. Smith', 'Reflector 12-inch'),
        (4, '2025-04-11 03:00:00+00', 'Variable luminosity measured. Possible pulsation cycle.', 'Dr. Chen', 'Photometer P-4'),
        (5, '2025-05-22 20:15:00+00', 'Clear spectrum analysis. No anomalies detected.', 'M. Alvarez', 'Spectrometer X-7'),
        (6, '2025-06-01 00:00:00+00', 'Galactic core imaging session. Excellent seeing conditions.', 'J. Doe', 'CCD Imager C-2'),
        (7, '2025-07-30 01:20:00+00', 'Ultraviolet excess detected near limb.', 'Dr. Patel', 'UV Photometer U-1'),
        (8, '2025-08-15 23:50:00+00', 'Parallax measurement refined. Cepheid period noted.', 'M. Alvarez', 'Astrograph A-3')
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Database initialized successfully with seed data!');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

init();
