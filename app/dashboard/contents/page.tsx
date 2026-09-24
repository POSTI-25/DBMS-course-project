"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LayoutGrid,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Rows3,
  Clock,
  Telescope,
  PanelRight,
} from "lucide-react";
import CelestialBadge from "@/components/CelestialBadge";
import TelemetryDrawer from "@/components/TelemetryDrawer";
import type { TelemetryRow } from "@/components/TelemetryDrawer";

const TABLES = ["users", "celestial_bodies", "observations"] as const;
type TableName = (typeof TABLES)[number];

interface TableData {
  rows: Record<string, unknown>[];
  count: number | null;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    if (Math.abs(value) >= 1e6 || (Math.abs(value) < 0.01 && value !== 0))
      return value.toExponential(3);
    return String(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ContentsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedTable = searchParams.get("table");
  const selectedTable: TableName = TABLES.includes(requestedTable as TableName) ? requestedTable as TableName : "celestial_bodies";
  const [page, setPage] = useState(1);
  const [data, setData]         = useState<TableData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [fetchTime, setFetchTime] = useState<number | null>(null);
  const requestId = useRef(0);

  // Telemetry drawer
  const [activeRow, setActiveRow] = useState<TelemetryRow | null>(null);

  const fetchData = useCallback(async (table: TableName, requestedPage: number) => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    const start = Date.now();
    try {
      const res = await fetch(`/api/tables/${table}/contents?page=${requestedPage}&pageSize=25`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch");
      if (current === requestId.current) { setData(json); setFetchTime(Date.now() - start); }
    } catch (e: unknown) {
      if (current === requestId.current) setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { const timer = setTimeout(() => { void fetchData(selectedTable, page); }, 0); return () => clearTimeout(timer); }, [selectedTable, page, fetchData]);

  const handleTableChange = (t: TableName) => {
    setPage(1);
    setData(null);
    setActiveRow(null);
    router.push(`/dashboard/contents?table=${t}`, { scroll: false });
  };

  const columns = data && data.rows.length > 0 ? Object.keys(data.rows[0]) : [];

  return (
    <div className="fade-in-up space-y-5">
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="p-1.5 rounded-lg"
              style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}
            >
              <LayoutGrid size={16} style={{ color: "var(--accent-cyan)" }} />
            </div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}
            >
              Table Contents
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Browse and inspect database rows — click any row to open the telemetry panel
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Table selector */}
          <div className="relative">
            <select
              aria-label="Select table"
              id="select-table"
              value={selectedTable}
              onChange={(e) => handleTableChange(e.target.value as TableName)}
              className="stellar-input pr-10 appearance-none cursor-pointer"
              style={{ minWidth: "200px" }}
            >
              {TABLES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--accent-cyan)" }}
            />
          </div>

          {/* Refresh */}
          <button
            id="btn-refresh-contents"
            onClick={() => fetchData(selectedTable, page)}
            disabled={loading}
            className="btn-primary"
            style={{ padding: "10px 16px" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat pills ────────────────────────────────────────────── */}
      {data && !loading && (
        <div className="flex flex-wrap gap-2.5">
          <div className="glass-card px-4 py-2 flex items-center gap-2" style={{ borderRadius: "10px" }}>
            <Rows3 size={13} style={{ color: "var(--accent-cyan)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{data.count ?? data.rows.length}</strong> rows
            </span>
          </div>
          <div className="glass-card px-4 py-2 flex items-center gap-2" style={{ borderRadius: "10px" }}>
            <LayoutGrid size={13} style={{ color: "var(--accent-purple)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{columns.length}</strong> columns
            </span>
          </div>
          {fetchTime !== null && (
            <div className="glass-card px-4 py-2 flex items-center gap-2" style={{ borderRadius: "10px" }}>
              <Clock size={13} style={{ color: "var(--accent-gold)" }} />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Query: <strong style={{ color: "var(--text-primary)" }}>{fetchTime}ms</strong>
              </span>
            </div>
          )}
          {activeRow && (
            <div className="glass-card px-4 py-2 flex items-center gap-2" style={{ borderRadius: "10px" }}>
              <PanelRight size={13} style={{ color: "var(--accent-cyan)" }} />
              <span className="text-sm" style={{ color: "var(--accent-cyan)" }}>
                Telemetry open
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Data grid ─────────────────────────────────────────────── */}
      <div className="hud-panel nebula-gradient overflow-hidden relative hud-scanline">
        {/* Neon top border glow */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.6), rgba(139,92,246,0.6), transparent)",
          }}
        />

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <Telescope
                size={36}
                className="loading-pulse"
                style={{ color: "var(--accent-cyan)" }}
              />
              <div
                style={{
                  position: "absolute", inset: -10,
                  borderRadius: "50%",
                  border: "1px solid rgba(34,211,238,0.3)",
                  animation: "pulse-glow 1.4s ease-in-out infinite",
                }}
              />
            </div>
            <p className="text-sm font-mono loading-pulse" style={{ color: "var(--text-muted)" }}>
              Querying {selectedTable}...
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertTriangle size={32} style={{ color: "#f87171" }} />
            <p className="text-sm font-semibold" style={{ color: "#f87171" }}>{error}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Make sure your PostgreSQL database is running and configured.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && data && (
          <div className="overflow-x-auto">
            {data.rows.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No rows found in &ldquo;{selectedTable}&rdquo;.
                </p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    {/* Celestial type badge column */}
                    {selectedTable === "celestial_bodies" && <th>Type</th>}
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                    <th style={{ width: 36 }} />
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => {
                    const isSelected = activeRow === row;
                    return (
                      <tr
                        key={String(row[selectedTable === "users" ? "user_id" : selectedTable === "observations" ? "obs_id" : "body_id"])}
                        onClick={() => setActiveRow(isSelected ? null : row)}
                        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveRow(isSelected ? null : row); } }}
                        tabIndex={0}
                        aria-label={`Inspect row ${(page - 1) * 25 + i + 1}`}
                        style={{
                          background: isSelected
                            ? "rgba(34,211,238,0.06)"
                            : undefined,
                          boxShadow: isSelected
                            ? "inset 3px 0 0 var(--accent-cyan)"
                            : undefined,
                        }}
                      >
                        {/* Row number */}
                        <td style={{ color: "var(--text-muted)", width: 36, fontSize: "0.72rem" }}>
                          {(page - 1) * 25 + i + 1}
                        </td>

                        {/* Celestial badge cell */}
                        {selectedTable === "celestial_bodies" && (
                          <td>
                            <CelestialBadge row={row} tableName={selectedTable} />
                          </td>
                        )}

                        {/* Data cells */}
                        {columns.map((col) => (
                          <td key={col} title={String(row[col] ?? "NULL")}>
                            {row[col] === null || row[col] === undefined ? (
                              <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.75rem" }}>
                                NULL
                              </span>
                            ) : (
                              formatCell(row[col])
                            )}
                          </td>
                        ))}

                        {/* Open drawer icon */}
                        <td style={{ width: 36, textAlign: "center" }}>
                          <PanelRight
                            size={13}
                            style={{
                              color: isSelected ? "var(--accent-cyan)" : "var(--text-muted)",
                              transition: "color 0.15s",
                              filter: isSelected ? "drop-shadow(0 0 4px var(--accent-cyan))" : "none",
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {data && !loading && !error && data.count !== null && data.count > 25 && <nav className="pagination" aria-label="Table pages"><span>Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, data.count)} of {data.count}</span><div><button className="btn-primary" disabled={page === 1} onClick={() => { setPage(value => value - 1); setActiveRow(null); }}>Previous</button><span>Page {page} of {Math.ceil(data.count / 25)}</span><button className="btn-primary" disabled={page >= Math.ceil(data.count / 25)} onClick={() => { setPage(value => value + 1); setActiveRow(null); }}>Next</button></div></nav>}

      {/* ── Telemetry Drawer ──────────────────────────────────────── */}
      <TelemetryDrawer
        row={activeRow}
        tableName={selectedTable}
        onClose={() => setActiveRow(null)}
      />
    </div>
  );
}

export default function ContentsPage() {
  return (
    <Suspense>
      <ContentsInner />
    </Suspense>
  );
}
