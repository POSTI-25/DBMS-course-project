"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Database,
  ShieldCheck,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Telescope,
  Users,
  Globe,
  Orbit,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard/contents",    label: "Contents",    icon: LayoutGrid,  description: "Browse table data"     },
  { href: "/dashboard/structure",   label: "Structure",   icon: Database,    description: "Column metadata"       },
  { href: "/dashboard/constraints", label: "Constraints", icon: ShieldCheck, description: "Schema introspection"  },
  { href: "/dashboard/modify",      label: "Modify",      icon: Pencil,      description: "Insert records"        },
];

const TABLE_LINKS = [
  { href: "/dashboard/contents?table=users",             label: "users",            icon: Users    },
  { href: "/dashboard/contents?table=celestial_bodies",  label: "celestial_bodies", icon: Globe    },
  { href: "/dashboard/contents?table=observations",      label: "observations",     icon: Telescope},
];

export default function Sidebar({ roleId }: { roleId: number }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="sidebar-shell relative flex flex-col transition-all duration-300 ease-in-out hud-scanline"
      style={{
        width: collapsed ? "64px" : "248px",
        minHeight: "calc(100vh - 57px)",
        background: "rgba(4,6,18,0.75)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderRight: "1px solid rgba(34,211,238,0.14)",
        boxShadow: "2px 0 24px rgba(0,0,0,0.5), inset -1px 0 0 rgba(34,211,238,0.06)",
        zIndex: 20,
        position: "relative",
        flexShrink: 0,
      }}
    >
      {/* ── Corner accent lines (HUD frame) ─── */}
      <span
        style={{
          position: "absolute", top: 0, left: 0,
          width: 24, height: 24,
          borderTop: "2px solid rgba(34,211,238,0.5)",
          borderLeft: "2px solid rgba(34,211,238,0.5)",
          borderRadius: "4px 0 0 0",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "absolute", bottom: 0, left: 0,
          width: 20, height: 20,
          borderBottom: "2px solid rgba(139,92,246,0.4)",
          borderLeft:   "2px solid rgba(139,92,246,0.4)",
          borderRadius: "0 0 0 4px",
          pointerEvents: "none",
        }}
      />

      {/* ── Collapse toggle ─────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        id="btn-sidebar-toggle"
        className="sidebar-toggle absolute -right-3.5 top-6 w-7 h-7 rounded-full flex items-center justify-center z-30 transition-all duration-200"
        style={{
          background: "rgba(6,9,24,0.95)",
          border: "1px solid rgba(34,211,238,0.3)",
          color: "var(--accent-cyan)",
          boxShadow: "0 0 10px rgba(34,211,238,0.2)",
        }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* ── Nav ─────────────────────────────── */}
      <nav className="sidebar-nav flex flex-col gap-1 p-3 pt-5">
        {!collapsed && (
          <p
            className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2 px-3"
            style={{ color: "rgba(34,211,238,0.4)" }}
          >
            Navigation
          </p>
        )}

        {NAV_ITEMS.filter(item => roleId === 1 || item.href !== "/dashboard/modify").map(({ href, label, icon: Icon, description }) => {
          const isActive = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative overflow-hidden"
              style={{
                background: isActive
                  ? "linear-gradient(90deg, rgba(34,211,238,0.1), rgba(34,211,238,0.03))"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(34,211,238,0.25)"
                  : "1px solid transparent",
                color: isActive ? "var(--accent-cyan)" : "var(--text-secondary)",
                boxShadow: isActive ? "0 0 14px rgba(34,211,238,0.08)" : "none",
              }}
            >
              {/* Left active bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                  style={{ background: "var(--accent-cyan)", boxShadow: "0 0 8px var(--accent-cyan)" }}
                />
              )}
              <Icon
                size={17}
                className="shrink-0 transition-transform group-hover:scale-110"
                style={{ filter: isActive ? "drop-shadow(0 0 6px rgba(34,211,238,0.6))" : "none" }}
              />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-none">{label}</p>
                  <p className="text-[11px] mt-1 truncate" style={{ color: "var(--text-muted)" }}>
                    {description}
                  </p>
                </div>
              )}
            </Link>
          );
        })}

        {/* ── Tables section ─────────────────── */}
        {!collapsed && (
          <>
            <div className="neon-divider my-3 mx-1" />
            <p
              className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2 px-3"
              style={{ color: "rgba(139,92,246,0.5)" }}
            >
              Tables
            </p>
            {TABLE_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--accent-cyan)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <Icon size={13} className="shrink-0" />
                <span className="text-xs truncate" style={{ fontFamily: "var(--font-geist-mono)" }}>
                  {label}
                </span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* ── DB status footer ───────────────── */}
      {!collapsed && (
        <div className="mt-auto p-4">
          <div
            className="rounded-xl p-3 relative overflow-hidden"
            style={{
              background: "rgba(34,211,238,0.04)",
              border: "1px solid rgba(34,211,238,0.15)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Orbit size={13} style={{ color: "var(--accent-cyan)" }} />
              <p className="text-xs font-bold tracking-wide" style={{ color: "var(--accent-cyan)" }}>
                stellar_archive
              </p>
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              PostgreSQL · 3 tables
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
