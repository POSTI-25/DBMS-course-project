"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LayoutGrid,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Rows3,
  Clock,
} from "lucide-react";

const TABLES = ["users", "celestial_bodies", "observations"] as const;
type TableName = (typeof TABLES)[number];

interface TableData {
  rows: Record<string, unknown>[];
  count: number | null;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ContentsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTable = (searchParams.get("table") as TableName) || "celestial_bodies";

  const [selectedTable, setSelectedTable] = useState<TableName>(initialTable);
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTime, setFetchTime] = useState<number | null>(null);

  const fetchData = useCallback(async (table: TableName) => {
    setLoading(true);
    setError(null);
    const start = Date.now();
    try {
      const res = await fetch(`/api/tables/${table}/contents`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch");
      setData(json);
      setFetchTime(Date.now() - start);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedTable);
  }, [selectedTable, fetchData]);

  const handleTableChange = (t: TableName) => {
    setSelectedTable(t);
    router.push(`/dashboard/contents?table=${t}`, { scroll: false });
  };

  const columns =
    data && data.rows.length > 0 ? Object.keys(data.rows[0]) : [];

  return (
    <div className="fade-in-up space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid size={20} style={{ color: "var(--accent-blue)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Table Contents
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Browse and inspect database rows
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Table selector */}
          <div className="relative">
            <select
              id="select-table"
              value={selectedTable}
              onChange={(e) => handleTableChange(e.target.value as TableName)}
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

          {/* Refresh */}
          <button
            id="btn-refresh-contents"
            onClick={() => fetchData(selectedTable)}
            disabled={loading}
            className="btn-primary"
            style={{ padding: "10px 16px" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      {data && !loading && (
        <div className="flex flex-wrap gap-3">
          <div
            className="glass-card px-4 py-2.5 flex items-center gap-2"
            style={{ borderRadius: "8px" }}
          >
            <Rows3 size={14} style={{ color: "var(--accent-cyan)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{data.count ?? data.rows.length}</strong> rows
            </span>
          </div>
          <div
            className="glass-card px-4 py-2.5 flex items-center gap-2"
            style={{ borderRadius: "8px" }}
          >
            <LayoutGrid size={14} style={{ color: "var(--accent-purple)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{columns.length}</strong> columns
            </span>
          </div>
          {fetchTime !== null && (
            <div
              className="glass-card px-4 py-2.5 flex items-center gap-2"
              style={{ borderRadius: "8px" }}
            >
              <Clock size={14} style={{ color: "var(--accent-gold)" }} />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Query: <strong style={{ color: "var(--text-primary)" }}>{fetchTime}ms</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Data grid */}
      <div className="glass-card nebula-gradient overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw
              size={32}
              className="animate-spin"
              style={{ color: "var(--accent-blue)" }}
            />
            <p className="text-sm loading-pulse" style={{ color: "var(--text-muted)" }}>
              Querying {selectedTable}...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertTriangle size={32} style={{ color: "#ef4444" }} />
            <p className="text-sm font-medium" style={{ color: "#ef4444" }}>
              {error}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Make sure your PostgreSQL database is running and configured.
            </p>
          </div>
        )}

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
                    <th>#</th>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ color: "var(--text-muted)", width: "40px" }}>
                        {i + 1}
                      </td>
                      {columns.map((col) => (
                        <td key={col} title={formatCell(row[col])}>
                          {row[col] === null ? (
                            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                              NULL
                            </span>
                          ) : (
                            formatCell(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
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
