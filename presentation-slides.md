# Stellar Archive DBMS — 12-slide presentation content

> **Instructions for Claude:** Turn each numbered section into one slide. Keep the slides visual and concise; use the speaker notes for verbal explanation. Use the project's cinematic dark-space visual style. Draw diagrams from the descriptions below. Do not invent features, table relationships, performance results, or security claims. Do not display real credentials or `.env` values.

## Slide 1 — Title

**Stellar Archive DBMS**  
An astronomical data management and PostgreSQL schema exploration dashboard

- DBMS course project
- Web interface for browsing, inspecting, and managing astronomical records
- Built around raw SQL and PostgreSQL, with role-based access

**Visual:** Dark observatory backdrop with a subtle black hole, three connected database-table icons, and the title. Avoid a literal space photo that makes text difficult to read.

**Speaker notes:** The space theme supports the subject matter, but the central project is a working relational database application.

## Slide 2 — Problem, users, and use case

**Problem:** Astronomical objects and their observations need a consistent structure, searchable records, and controlled editing.

- An administrator records celestial bodies and observation logs, corrects entries, and inspects the schema.
- A viewer browses records and examines table structure without editing.
- Example: add a body, log an observation linked to it, then retrieve both with a SQL join.

**Diagram brief:** A three-step use-case flow: **Catalog a celestial body → Record an observation → Browse/query the archive**. Place Admin above all three steps and Viewer above the last step only.

**Speaker notes:** This is a teaching-scale archive, not a live telescope ingestion system. The emphasis is on relational design and DBMS operations.

## Slide 3 — What the application provides

- **Contents:** browse `users`, `celestial_bodies`, and `observations`; paginate, refresh, inspect a row.
- **Structure:** view live column names, types, nullability, defaults, and length limits.
- **Constraints:** inspect PostgreSQL primary keys, foreign keys, unique constraints, and checks.
- **Modify (Admin):** insert, update, and delete astronomical records with SQL previews.
- **Raw SQL (Admin):** run bounded read-only queries, including joins and aggregates.

**Visual:** Five small dashboard panels or screenshots. Label the first three “read” and the last two “admin.”

**Speaker notes:** The UI reads the database through API routes. The Structure and Constraints screens query actual metadata, rather than displaying a hard-coded schema.

## Slide 4 — Technology stack and architecture

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Interface | React 19, TypeScript, Tailwind CSS 4, Lucide | Forms, tables, navigation, visual design |
| Web server | Next.js 16 App Router | Pages, route handlers, redirects, server checks |
| Data access | `pg` / node-postgres | Connection pool and raw parameterized SQL |
| Database | PostgreSQL | Data, constraints, indexes, transactions |
| Auth primitives | Node `crypto` | scrypt password hashes, HMAC session signatures |

**Architecture diagram brief:** Browser → Next.js pages/components → API route handlers → `pg.Pool` → PostgreSQL. Add a separate arrow from the browser cookie to server-side session verification. Label the SQL layer **raw SQL; no ORM**.

**Speaker notes:** Next.js runs the backend endpoints and renders the application. Browser code does not connect directly to PostgreSQL.

## Slide 5 — Relational model / ER diagram

**Three tables:**

- `users`: application accounts (`user_id` PK, unique `username`, `password_hash`, `role_id`, `created_at`).
- `celestial_bodies`: catalog (`body_id` PK, `name`, `spectral_type`, `mass`, `distance_ly`, `constellation`, `discovered_at`).
- `observations`: logs (`obs_id` PK, `body_id` FK, `observed_at`, `notes`, `observer`, `instrument`).

**ER diagram brief:** Draw `celestial_bodies` **1 → 0..many** `observations`, joined on `body_id`. Annotate the FK with **ON DELETE CASCADE**. Show `users` separately: it authenticates app users and has no foreign-key relationship to the astronomy tables. Mark each PK, the FK, and unique `users.username`.

**Speaker notes:** A body can have zero or many observations. Each observation must point to exactly one existing body. The `observer` field is text, not a foreign key to `users`.

## Slide 6 — Schema design and DBMS constraints

- `SERIAL PRIMARY KEY` creates row identifiers for all three tables.
- `NOT NULL`: required account fields, body name, observation body link, and observation timestamp.
- `UNIQUE(username)` prevents duplicate account names.
- `CHECK(role_id IN (1, 2))` limits application roles; `CHECK(mass >= 0)` and `CHECK(distance_ly >= 0)` enforce valid nonnegative quantities.
- `observations.body_id REFERENCES celestial_bodies(body_id) ON DELETE CASCADE` enforces referential integrity.
- Defaults: `created_at` and `observed_at` use `NOW()`; `role_id` defaults to viewer (`2`).

**Diagram brief:** Show a sample invalid observation with an unknown `body_id` being rejected at the FK boundary; show deletion of a body cascading to its linked observations.

**Speaker notes:** PostgreSQL is the final authority on data integrity. The API also validates values so users receive clearer errors. Null values in optional numeric fields are allowed by the SQL checks.

## Slide 7 — Authentication and authorization

1. `db:init` creates or updates the configured admin account; optional viewer account.
2. Login looks up `users.username` with `$1` and checks the supplied password against a salted scrypt hash.
3. The server signs a session payload (`userId`, `username`, `roleId`, expiry) with HMAC-SHA256 and sets an HTTP-only cookie.
4. Dashboard layouts verify the cookie; API routes independently check session and role.
5. Admin (`role_id=1`) can modify records and use Raw SQL; Viewer (`role_id=2`) can browse contents and schema.

**Sequence diagram brief:** Browser login form → `/api/auth/login` → PostgreSQL `users` → password verification → signed cookie → `/dashboard/...` and `/api/...` role checks. Show 401 for invalid login and 403 for viewer attempting an admin API.

**Speaker notes:** These are **application-level roles**, not PostgreSQL `GRANT` roles. Passwords are stored as hashes; the session cookie is signed, not encrypted, and lasts up to eight hours.

## Slide 8 — CRUD and parameterized SQL

- **Create:** `INSERT INTO ... VALUES ($1, ...) RETURNING *`
- **Read:** `SELECT ... ORDER BY primary_key LIMIT $1 OFFSET $2`
- **Update:** `UPDATE ... SET ... WHERE primary_key = $N RETURNING *`
- **Delete:** `DELETE ... WHERE primary_key = $1 RETURNING *`
- Writes are allowed only for `celestial_bodies` and `observations`.
- Table and column names come from allowlists; values are passed separately as SQL parameters.

**Diagram brief:** Form → server validation → allowlisted SQL identifiers + bound values → PostgreSQL → returned row/count/time → UI feedback. Highlight the primary-key `WHERE` clause on Update and Delete.

**Speaker notes:** SQL placeholders protect values from injection. Identifiers cannot be bound as `$1`, so the backend validates table/column names before assembling SQL. The delete UI warns about cascaded observations.

## Slide 9 — Live schema introspection

- `information_schema.columns` supplies column order, name, type, default, nullability, and max length.
- `pg_constraint` supplies primary, foreign, unique, and check definitions.
- `pg_class` and `pg_namespace` restrict constraint lookup to the selected table in `public`.
- Both Structure and Constraints screens use `/api/tables/:tableName/constraints`.

**Diagram brief:** PostgreSQL metadata catalogs → schema API → split into “Structure cards” and “Constraints table.” Include one example: `observations.body_id` appears as integer, NOT NULL, and FK to `celestial_bodies`.

**Speaker notes:** This demonstrates system catalog querying. The UI reflects the live schema returned by PostgreSQL; it does not parse the seed script.

## Slide 10 — Querying, indexes, and transactions

- The admin SQL workspace supports read-only `SELECT`/`WITH` queries, including joins, counts, and metadata queries.
- It runs in `BEGIN READ ONLY`, sets a five-second statement timeout, and displays at most 100 result rows.
- Contents pagination defaults to 25 rows per page; API maximum is 100.
- Extra indexes: `observations(body_id)` and `observations(observed_at DESC)`.
- `db:init` wraps schema setup, account upserts, and conditional seed data in a transaction (`BEGIN` / `COMMIT`, rollback on error).

**Diagram brief:** A compact query plan story: filter/join observations by indexed `body_id`, order by `observed_at`; separately show the initialization transaction as one atomic box.

**Speaker notes:** Indexes are intended to support common lookups and time ordering, but do not claim measured speedups without an `EXPLAIN ANALYZE` comparison. Primary keys and the unique username constraint also get PostgreSQL indexes.

## Slide 11 — Demo walkthrough

1. Sign in as Admin; show the role badge.
2. Open Contents and browse `celestial_bodies`.
3. Open Structure and Constraints for `observations`; point out its FK and `ON DELETE CASCADE`.
4. Insert a new body, then insert an observation using that `body_id`.
5. Run the preset join query to show the linked records.
6. Update a field; optionally demonstrate delete confirmation and cascade using disposable demo data.
7. If a viewer account is configured, show its read-only navigation and rejected admin action.

**Visual:** Numbered screenshot placeholders with arrows. Leave room for real screenshots captured from the running app; do not fabricate results.

**Speaker notes:** Prepare a demo account and disposable records in advance. Avoid deleting seeded data during the presentation.

## Slide 12 — Project highlights and DBMS takeaways

**Working features:** authenticated Admin and Viewer access; paginated table browsing; row inspection; live Structure and Constraints views; Admin insert, update, delete, and read-only SQL queries.

**DBMS concepts demonstrated:** a three-table relational schema; primary and foreign keys; uniqueness, `NOT NULL`, and `CHECK` constraints; cascading deletes; indexes; transactions; joins; and parameterized SQL.

**Closing message:** Stellar Archive turns PostgreSQL concepts into a usable observatory-style application, where the database enforces integrity and the interface makes its data and schema easy to explore.

**Visual:** Place a dashboard screenshot at the center, with three small callouts labeled **Explore data**, **Inspect schema**, and **Manage records**. Add a compact `celestial_bodies` → `observations` relationship below it and end with “Questions?”

**Speaker notes:** Close by connecting the live demo back to the core DBMS ideas: structured relationships, integrity rules, direct SQL operations, and controlled access.
