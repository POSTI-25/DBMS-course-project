# Product Requirements Document (PRD)

## Product Overview
* **Project Name:** Stellar Archive DBMS
* **Objective:** Build a web-based database administration dashboard that fulfills specific academic requirements (schema introspection, role-based access, CRUD) wrapped in a modern, astrophysics-themed user interface.

## Core Functional Requirements
* **Role-Based Access Control (RBAC):** The system must authenticate users, differentiate permissions by a specific role ID (e.g., Admin vs. Viewer), and display the active session state in the application header.
* **Schema Introspection Engine:** The backend must dynamically query the database's metadata to populate the "Constraints" and "Structure" views, displaying column names, data types, default values, and maximum lengths.
* **Dynamic CRUD Interface:** The "Modify" menu must provide secure forms to execute Create, Read, Update, and Delete operations on the underlying astronomical datasets.
* **Data Visualization:** The "Contents" menu must render requested database tables into a clean, paginated data grid.

## Proposed Database Schema

| Table Name | Purpose | Key Columns & Relationships |
| :--- | :--- | :--- |
| `Users` | Authentication and session handling. | `user_id` (PK), `username`, `password_hash`, `role_id` |
| `Celestial_Bodies` | Core data for stars and planets. | `body_id` (PK), `name`, `spectral_type`, `mass` |
| `Observations` | Logs of recorded astronomical data. | `obs_id` (PK), `body_id` (FK), `date`, `notes` |

## Technical Architecture
* **Frontend Environment:** React with Tailwind CSS (modernizing the outdated UI).
* **Backend & API:** Next.js App Router for server-side processing and POST requests.
* **Database Integration:** PostgreSQL accessed strictly via raw SQL queries using the `pg` library. No ORMs.