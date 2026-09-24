"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, RefreshCw, ChevronDown, AlertTriangle, Info } from "lucide-react";

const TABLES = ["users", "celestial_bodies", "observations"] as const;
type TableName = (typeof TABLES)[number];

interface ColumnInfo {
  name: string;
  table: string;
  defaultValue: string | null;
  maximumLength: number | null;
  type: string;
  nullable: string;
  position: number;
}
interface TableConstraint { name: string; type: string; definition: string }

const TYPE_COLOR: Record<string, string> = {
  integer: "var(--accent-blue)",
  "character varying": "#a78bfa",
  text: "#a78bfa",
  numeric: "var(--accent-gold)",
  date: "var(--accent-cyan)",
  "timestamp with time zone": "var(--accent-cyan)",
  boolean: "#4ade80",
  serial: "var(--accent-blue)",
};

function getTypeColor(type: string) {
  return TYPE_COLOR[type] || "var(--text-secondary)";
}

export default function ConstraintsPage() {
  const [selectedTable, setSelectedTable] = useState<TableName>("celestial_bodies");
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [constraints, setConstraints] = useState<TableConstraint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConstraints = useCallback(async (table: TableName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tables/${table}/constraints`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch");
      setColumns(json.columns);
      setConstraints(json.constraints ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void fetchConstraints(selectedTable); }, 0);
    return () => clearTimeout(timer);
  }, [selectedTable, fetchConstraints]);

  return (
    <div className="fade-in-up space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} style={{ color: "var(--accent-blue)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Constraints &amp; Schema
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Introspecting{" "}
            <code
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: "rgba(74,125,255,0.1)", color: "var(--accent-blue)" }}
            >
              information_schema.columns
            </code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              id="select-table-constraints"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value as TableName)}
              className="stellar-input pr-10 appearance-none cursor-pointer"
              style={{ minWidth: "200px" }}
            >
              {TABLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
          </div>

          <button
            id="btn-refresh-constraints"
            onClick={() => fetchConstraints(selectedTable)}
            disabled={loading}
            className="btn-primary"
            style={{ padding: "10px 16px" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {!loading && !error && <section className="glass-card p-5"><h2 className="text-base font-semibold mb-3">Database constraints</h2>{constraints.length === 0 ? <p className="text-sm" style={{color:"var(--text-secondary)"}}>No constraints are defined for this table.</p> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Name</th><th>Type</th><th>Definition</th></tr></thead><tbody>{constraints.map(item => <tr key={item.name}><td>{item.name}</td><td><span className="badge badge-blue">{item.type}</span></td><td><code className="text-xs whitespace-normal">{item.definition}</code></td></tr>)}</tbody></table></div>}</section>}

      {/* Info banner */}
      <div
        className="flex items-start gap-3 p-4 rounded-lg"
        style={{
          background: "rgba(74, 125, 255, 0.06)",
          border: "1px solid rgba(74, 125, 255, 0.2)",
        }}
      >
        <Info size={16} style={{ color: "var(--accent-blue)", marginTop: "1px", flexShrink: 0 }} />
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          This view shows database rules and column metadata for the{" "}
          <strong style={{ color: "var(--text-primary)" }}>{selectedTable}</strong> table,
          including primary and foreign keys, data types, defaults, and nullability sourced
          directly from PostgreSQL.
        </p>
      </div>

      {/* Schema grid */}
      <div className="glass-card nebula-gradient overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw
              size={32}
              className="animate-spin"
              style={{ color: "var(--accent-blue)" }}
            />
            <p className="text-sm loading-pulse" style={{ color: "var(--text-muted)" }}>
              Querying information_schema...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertTriangle size={32} style={{ color: "#ef4444" }} />
            <p className="text-sm font-medium" style={{ color: "#ef4444" }}>
              {error}
            </p>
          </div>
        )}

        {!loading && !error && columns.length > 0 && (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Column Name</th>
                  <th>Table</th>
                  <th>Data Type</th>
                  <th>Max Length</th>
                  <th>Default Value</th>
                  <th>Nullable</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col) => (
                  <tr key={col.name}>
                    <td style={{ color: "var(--text-muted)", width: "40px" }}>
                      {col.position}
                    </td>
                    <td>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--text-primary)", fontFamily: "var(--font-geist-mono)" }}
                      >
                        {col.name}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>
                        {col.table}
                      </span>
                    </td>
                    <td>
                      <span
                        className="font-mono text-xs px-2 py-1 rounded"
                        style={{
                          background: `${getTypeColor(col.type)}18`,
                          color: getTypeColor(col.type),
                          border: `1px solid ${getTypeColor(col.type)}30`,
                        }}
                      >
                        {col.type}
                      </span>
                    </td>
                    <td style={{ color: col.maximumLength ? "var(--text-primary)" : "var(--text-muted)" }}>
                      {col.maximumLength ?? "—"}
                    </td>
                    <td>
                      {col.defaultValue ? (
                        <code
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(245, 158, 11, 0.1)",
                            color: "var(--accent-gold)",
                            fontFamily: "var(--font-geist-mono)",
                          }}
                        >
                          {col.defaultValue}
                        </code>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${col.nullable === "YES" ? "badge-green" : "badge-purple"}`}
                        style={{ fontSize: "0.7rem" }}
                      >
                        {col.nullable === "YES" ? "nullable" : "not null"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && columns.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No columns found for &ldquo;{selectedTable}&rdquo;.
            </p>
          </div>
        )}
      </div>

      {/* Summary cards */}
      {!loading && !error && columns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Columns", value: columns.length, color: "var(--accent-blue)" },
            {
              label: "Nullable",
              value: columns.filter((c) => c.nullable === "YES").length,
              color: "#4ade80",
            },
            {
              label: "With Default",
              value: columns.filter((c) => c.defaultValue).length,
              color: "var(--accent-gold)",
            },
            {
              label: "Unique Types",
              value: new Set(columns.map((c) => c.type)).size,
              color: "var(--accent-purple)",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card p-4 text-center" style={{ borderRadius: "10px" }}>
              <p className="text-2xl font-bold" style={{ color }}>
                {value}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
