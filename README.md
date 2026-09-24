# Stellar Archive DBMS

A PostgreSQL database administration project for astronomical records. The Next.js app uses raw, parameterized SQL through `pg` and provides authenticated browsing, schema inspection, and administrator CRUD operations.

## Requirements

- Node.js 22 or newer
- PostgreSQL with a database named `stellar_archive` (or another name in the connection settings)

## Setup

1. Run `npm install`.
2. Copy `.env.local.example` to `.env.local` and set the PostgreSQL credentials, a random `SESSION_SECRET` of at least 32 characters, and an `ADMIN_PASSWORD` of at least 12 characters. Set `VIEWER_PASSWORD` to create a read-only viewer account.
3. Create the PostgreSQL database if it does not exist. For example, run `createdb stellar_archive` with an account that has database creation rights.
4. Run `npm run db:init`. This creates missing tables and indexes, seeds sample astronomical data into empty tables, and creates or updates the configured login accounts. It preserves existing celestial bodies and observations. Running it again resets the configured account passwords to the environment values.
5. Run `npm run dev` and open `http://localhost:3000`.

The app also accepts a `DATABASE_URL` connection string instead of separate `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` values.

## Roles and features

| Role | Capabilities |
| --- | --- |
| Administrator (role ID 1) | Browse tables, inspect columns and constraints, insert/update/delete astronomical records, run read-only SQL queries |
| Viewer (role ID 2) | Browse tables and inspect schema |

The contents API returns 25 rows per page by default, with a maximum page size of 100. User password hashes are never included in table contents. The SQL workspace accepts single read-only queries and shows at most 100 result rows. Deleting a celestial body also deletes linked observations through the database foreign key.

## Project structure

- `src/scripts/init-db.js`: idempotent schema setup and sample data
- `src/lib/db.ts`: PostgreSQL connection pool
- `src/lib/session.ts`: password hashing and signed session cookies
- `app/api/`: login, logout, read, schema, and modify endpoints
- `app/dashboard/`: data browser, structure, constraints, and CRUD interface

## Checks

Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Database-backed behavior also requires a running PostgreSQL instance configured through `.env.local`.
