"use client";

import { Star, LogOut, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Session } from "@/lib/session";

export default function Topbar({ session }: { session: Session }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login"); router.refresh();
  }
  return (
    <header
      className="topbar sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: "rgba(2,4,14,0.80)",
        borderBottom: "1px solid rgba(34,211,238,0.18)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 1px 0 rgba(34,211,238,0.08), 0 4px 24px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── Logo ───────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #1e6fff, #7c3aed)",
            boxShadow: "0 0 18px rgba(74,125,255,0.55), 0 0 6px rgba(139,92,246,0.3)",
          }}
        >
          <Star size={17} color="white" fill="white" />
        </div>
        <div>
          <h1
            className="text-base font-bold leading-none gradient-text"
            style={{ letterSpacing: "0.04em" }}
          >
            Stellar Archive
          </h1>
          <p className="text-[10px] mt-0.5 tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
            DBMS Dashboard
          </p>
        </div>
      </div>

      {/* ── Right cluster ──────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Role / User badges */}
        <div className="hidden md:flex items-center gap-2">
          <span className="badge badge-purple">
            <Shield size={10} />
            {session.roleId === 1 ? "Administrator" : "Viewer"}
          </span>
          <span className="badge badge-cyan">
            <User size={10} />
            UID {session.userId}
          </span>
        </div>

        {/* Avatar + username */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(74,125,255,0.08)",
            border: "1px solid rgba(74,125,255,0.2)",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
              boxShadow: "0 0 10px rgba(74,125,255,0.4)",
            }}
          >
            {session.username[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {session.username}
          </span>
        </div>

        {/* Logoff */}
        <button
          className="btn-danger"
          style={{ padding: "7px 13px", fontSize: "0.78rem" }}
          onClick={logout}
          id="btn-logoff"
        >
          <LogOut size={13} />
          Logoff
        </button>
      </div>
    </header>
  );
}
