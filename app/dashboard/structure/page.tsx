"use client";

import { useEffect, useState, useCallback } from "react";
import { Database, RefreshCw, ChevronDown, AlertTriangle } from "lucide-react";

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

export default function StructurePage() {
  const [selectedTable, setSelectedTable] = useState<TableName>("celestial_bodies");
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStructure = useCallback(async (table: TableName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tables/${table}/constraints`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch");
      setColumns(json.columns);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStructure(selectedTable);
  }, [selectedTable, fetchStructure]);

  return (
    <div className="fade-in-up space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database size={20} style={{ color: "var(--accent-blue)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Table Structure
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Column definitions and data types
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              id="select-table-structure"
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
            id="btn-refresh-structure"
            onClick={() => fetchStructure(selectedTable)}
            disabled={loading}
            className="btn-primary"
            style={{ padding: "10px 16px" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Column cards */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <RefreshCw size={32} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
          <p className="text-sm loading-pulse" style={{ color: "var(--text-muted)" }}>
            Loading structure...
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div
              key={col.name}
              className="glass-card p-5 fade-in-up"
              style={{
                borderLeft: "3px solid var(--accent-blue)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(74,125,255,0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3
                  className="font-semibold text-sm break-all"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-geist-mono)" }}
                >
                  {col.name}
                </h3>
                <span
                  className="text-xs shrink-0 px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(74,125,255,0.1)",
                    color: "var(--accent-blue)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  #{col.position}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Type</span>
                  <code
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(139, 92, 246, 0.1)",
                      color: "var(--accent-purple)",
                    }}
                  >
                    {col.type}
                  </code>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Nullable</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: col.nullable === "YES" ? "#4ade80" : "#f87171" }}
                  >
                    {col.nullable === "YES" ? "YES" : "NO"}
                  </span>
                </div>

                {col.maximumLength && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Max Length</span>
                    <span className="text-xs" style={{ color: "var(--accent-gold)" }}>
                      {col.maximumLength}
                    </span>
                  </div>
                )}

                {col.defaultValue && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>Default</span>
                    <code
                      className="text-xs truncate"
                      style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-geist-mono)" }}
                      title={col.defaultValue}
                    >
                      {col.defaultValue}
                    </code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
