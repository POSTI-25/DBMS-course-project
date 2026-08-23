"use client";

import { X, Star, Globe, Zap, Orbit, HelpCircle, Ruler, Weight, MapPin, Calendar, Eye } from "lucide-react";
import { useEffect } from "react";

export type CelestialType = "star" | "planet" | "galaxy" | "comet" | "unknown";

export interface TelemetryRow {
  [key: string]: unknown;
}

interface TelemetryDrawerProps {
  row: TelemetryRow | null;
  tableName: string;
  onClose: () => void;
}

function detectCelestialType(row: TelemetryRow): CelestialType {
  const spectral = String(row.spectral_type ?? "").toUpperCase();
  const name = String(row.name ?? "").toLowerCase();
  if (/galaxy|nebula|cluster/i.test(name)) return "galaxy";
  if (/comet|meteor|asteroid/i.test(name)) return "comet";
  if (/^(O|B|A|F|G|K|M|L|T|Y|W|R|N|S)/.test(spectral)) return "star";
  if (/^P[A-Z]/i.test(spectral) || /planet/i.test(name)) return "planet";
  if (spectral) return "star"; // spectral class present → stellar object
  return "unknown";
}

const TYPE_CONFIG: Record<CelestialType, {
  icon: React.ElementType;
  label: string;
  badgeClass: string;
  glow: string;
  accent: string;
}> = {
  star:    { icon: Star,       label: "Star",    badgeClass: "badge-star",    glow: "rgba(245,158,11,0.3)",  accent: "#fcd34d" },
  planet:  { icon: Globe,      label: "Planet",  badgeClass: "badge-planet",  glow: "rgba(34,211,238,0.3)",  accent: "#67e8f9" },
  galaxy:  { icon: Orbit,      label: "Galaxy",  badgeClass: "badge-galaxy",  glow: "rgba(232,121,249,0.3)", accent: "#f0abfc" },
  comet:   { icon: Zap,        label: "Comet",   badgeClass: "badge-comet",   glow: "rgba(99,102,241,0.3)",  accent: "#a5b4fc" },
  unknown: { icon: HelpCircle, label: "Unknown", badgeClass: "badge-unknown", glow: "rgba(100,116,139,0.2)", accent: "#94a3b8" },
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") {
    if (Math.abs(v) >= 1e6 || (Math.abs(v) < 0.01 && v !== 0))
      return v.toExponential(4);
    return v.toLocaleString();
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))
    return new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  return String(v);
}

const ICON_MAP: Record<string, React.ElementType> = {
  mass:        Weight,
  distance_ly: Ruler,
  constellation: MapPin,
  discovered_at: Calendar,
  observed_at:   Calendar,
  notes:         Eye,
};

export default function TelemetryDrawer({ row, tableName, onClose }: TelemetryDrawerProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!row) return null;

  const celestialType = tableName === "celestial_bodies" ? detectCelestialType(row) : "unknown";
  const cfg = TYPE_CONFIG[celestialType];
  const TypeIcon = cfg.icon;

  const entries = Object.entries(row);

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Drawer panel */}
      <div
        className="slide-in-right fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "min(420px, 92vw)",
          background: "rgba(4,6,22,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderLeft: `1px solid ${cfg.accent}30`,
          boxShadow: `-4px 0 60px rgba(0,0,0,0.7), -1px 0 0 ${cfg.accent}18`,
        }}
      >
        {/* HUD top corner accent */}
        <span
          style={{
            position: "absolute", top: 0, right: 0,
            width: 32, height: 32,
            borderTop: `2px solid ${cfg.accent}80`,
            borderRight: `2px solid ${cfg.accent}80`,
            borderRadius: "0 0 0 4px",
            pointerEvents: "none",
          }}
        />

        {/* ── Header ──────────────────────────── */}
        <div
          className="flex items-start justify-between p-5"
          style={{ borderBottom: `1px solid ${cfg.accent}20` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `${cfg.glow}`,
                border: `1px solid ${cfg.accent}40`,
                boxShadow: `0 0 16px ${cfg.glow}`,
              }}
            >
              <TypeIcon size={20} style={{ color: cfg.accent }} />
            </div>
            <div>
              <p className="text-[10px] tracking-widest uppercase font-bold mb-0.5" style={{ color: cfg.accent }}>
                Telemetry Panel
              </p>
              <h2 className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                {String(row.name ?? row.username ?? `Record #${row[Object.keys(row)[0]]}`)}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all"
            style={{
              color: "var(--text-muted)",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Type badge ─────────────────────── */}
        {tableName === "celestial_bodies" && (
          <div className="px-5 py-3 flex items-center gap-2">
            <span className={`badge ${cfg.badgeClass}`}>
              <TypeIcon size={10} />
              {cfg.label}
            </span>
            {row.spectral_type != null && String(row.spectral_type) && (
              <span className="badge badge-cyan">
                Type {String(row.spectral_type)}
              </span>
            )}
          </div>
        )}

        {/* ── Metric cards (for celestial_bodies) ── */}
        {tableName === "celestial_bodies" && (
          <div className="px-5 pb-2 grid grid-cols-2 gap-3">
            {["mass", "distance_ly"].map((key) => {
              if (row[key] === undefined || row[key] === null) return null;
              const FieldIcon = ICON_MAP[key] ?? Eye;
              const numVal = Number(row[key]);
              return (
                <div
                  key={key}
                  className="rounded-xl p-3"
                  style={{
                    background: `${cfg.glow}`,
                    border: `1px solid ${cfg.accent}25`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <FieldIcon size={11} style={{ color: cfg.accent }} />
                    <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: cfg.accent }}>
                      {key === "distance_ly" ? "Distance (ly)" : "Mass (kg)"}
                    </p>
                  </div>
                  <p className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>
                    {numVal.toExponential(3)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── All fields ──────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2">
          <p
            className="text-[9px] uppercase tracking-[0.2em] font-bold mb-3 mt-1"
            style={{ color: "rgba(34,211,238,0.4)" }}
          >
            Raw Record
          </p>
          {entries.map(([key, val]) => {
            const FieldIcon = ICON_MAP[key];
            return (
              <div
                key={key}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(34,211,238,0.07)",
                }}
              >
                {FieldIcon && (
                  <FieldIcon size={13} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[10px] uppercase tracking-wider font-bold mb-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {key}
                  </p>
                  <p
                    className="text-sm break-words"
                    style={{
                      color: val === null || val === undefined ? "var(--text-muted)" : "var(--text-primary)",
                      fontFamily: "var(--font-geist-mono)",
                      fontStyle: val === null ? "italic" : "normal",
                    }}
                  >
                    {val === null || val === undefined ? "NULL" : formatValue(val)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────── */}
        <div
          className="p-4"
          style={{ borderTop: "1px solid rgba(34,211,238,0.1)" }}
        >
          <p className="text-[10px] text-center tracking-widest" style={{ color: "var(--text-muted)" }}>
            STELLAR ARCHIVE · {tableName.toUpperCase()} · ROW VIEW
          </p>
        </div>
      </div>
    </>
  );
}
