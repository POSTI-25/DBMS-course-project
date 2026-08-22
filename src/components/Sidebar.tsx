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
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  {
    href: "/dashboard/contents",
    label: "Contents",
    icon: LayoutGrid,
    description: "Browse table data",
  },
  {
    href: "/dashboard/structure",
    label: "Structure",
    icon: Database,
    description: "Column metadata",
  },
  {
    href: "/dashboard/constraints",
    label: "Constraints",
    icon: ShieldCheck,
    description: "Schema introspection",
  },
  {
    href: "/dashboard/modify",
    label: "Modify",
    icon: Pencil,
    description: "Insert records",
  },
];

const TABLE_LINKS = [
  { href: "/dashboard/contents?table=users", label: "users", icon: Users },
  {
    href: "/dashboard/contents?table=celestial_bodies",
    label: "celestial_bodies",
    icon: Globe,
  },
  {
    href: "/dashboard/contents?table=observations",
    label: "observations",
    icon: Telescope,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="relative flex flex-col transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? "64px" : "240px",
        minHeight: "calc(100vh - 57px)",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        id="btn-sidebar-toggle"
        className="absolute -right-3.5 top-6 w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all duration-200"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-accent)",
          color: "var(--text-secondary)",
        }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="flex flex-col gap-1 p-3 pt-4">
        {/* Section label */}
        {!collapsed && (
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2 px-3"
            style={{ color: "var(--text-muted)" }}
          >
            Navigation
          </p>
        )}

        {NAV_ITEMS.map(({ href, label, icon: Icon, description }) => {
          const isActive = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative overflow-hidden"
              style={{
                background: isActive
                  ? "linear-gradient(90deg, rgba(74,125,255,0.15), rgba(74,125,255,0.05))"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(74,125,255,0.25)"
                  : "1px solid transparent",
                color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r"
                  style={{ background: "var(--accent-blue)" }}
                />
              )}
              <Icon
                size={18}
                className="shrink-0 transition-transform group-hover:scale-110"
              />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-none">{label}</p>
                  <p
                    className="text-xs mt-1 truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {description}
                  </p>
                </div>
              )}
            </Link>
          );
        })}

        {/* Tables section */}
        {!collapsed && (
          <>
            <div
              className="h-px my-3 mx-2"
              style={{ background: "var(--border)" }}
            />
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-2 px-3"
              style={{ color: "var(--text-muted)" }}
            >
              Tables
            </p>
            {TABLE_LINKS.map(({ href, label, icon: Icon }) => {
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150"
                  style={{
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <Icon size={14} className="shrink-0" />
                  <span
                    className="text-xs font-mono truncate"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom version indicator */}
      {!collapsed && (
        <div className="mt-auto p-4">
          <div
            className="rounded-lg p-3"
            style={{
              background: "rgba(74,125,255,0.05)",
              border: "1px solid rgba(74,125,255,0.15)",
            }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--accent-blue)" }}>
              PostgreSQL v16
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              stellar_archive DB
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
