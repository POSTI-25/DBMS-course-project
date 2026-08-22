"use client";

import { Star, LogOut, Shield, User, Wifi } from "lucide-react";

// Mock session state as specified in PRD
const SESSION = {
  roleId: 1,
  userId: 7,
  username: "admin",
  roleName: "Admin",
};

export default function Topbar() {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: "rgba(9, 13, 26, 0.95)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{
            background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
            boxShadow: "0 0 16px var(--accent-blue-glow)",
          }}
        >
          <Star size={18} color="white" fill="white" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-none gradient-text">
            Stellar Archive
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            DBMS Dashboard
          </p>
        </div>
      </div>

      {/* Session Info + Actions */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="hidden sm:flex items-center gap-1.5">
          <Wifi size={13} style={{ color: "#4ade80" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            PostgreSQL Connected
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px" style={{ background: "var(--border)" }} />

        {/* Role badge */}
        <div className="hidden md:flex items-center gap-2">
          <span className="badge badge-purple">
            <Shield size={11} />
            Role ID = {SESSION.roleId}
          </span>
          <span className="badge badge-blue">
            <User size={11} />
            Valid User ID = {SESSION.userId}
          </span>
        </div>

        {/* Username */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(74, 125, 255, 0.08)", border: "1px solid rgba(74,125,255,0.2)" }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))" }}
          >
            {SESSION.username[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {SESSION.username}
          </span>
        </div>

        {/* Logoff button */}
        <button
          className="btn-danger text-xs"
          style={{ padding: "7px 14px" }}
          onClick={() => alert("Session terminated.")}
          id="btn-logoff"
        >
          <LogOut size={13} />
          Logoff
        </button>
      </div>
    </header>
  );
}
