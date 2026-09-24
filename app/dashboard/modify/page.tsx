"use client";

import { useState } from "react";
import { Pencil, Plus, Save, Trash2, Terminal, Globe, Telescope } from "lucide-react";
import InsertTab from "@/components/modify/InsertTab";
import UpdateTab from "@/components/modify/UpdateTab";
import DeleteTab from "@/components/modify/DeleteTab";
import RawSqlTab from "@/components/modify/RawSqlTab";

type DmlTab  = "insert" | "update" | "delete" | "rawsql";
type Table   = "celestial_bodies" | "observations";

const DML_TABS: { id: DmlTab; label: string; icon: React.ElementType; accent: string }[] = [
  { id:"insert",  label:"Insert",   icon:Plus,     accent:"var(--accent-cyan)"   },
  { id:"update",  label:"Update",   icon:Save,     accent:"var(--accent-purple)" },
  { id:"delete",  label:"Delete",   icon:Trash2,   accent:"#f87171"              },
  { id:"rawsql",  label:"Raw SQL",  icon:Terminal, accent:"#4ade80"              },
];

export default function ModifyPage() {
  const [dmlTab,  setDmlTab]  = useState<DmlTab>("insert");
  const [table,   setTable]   = useState<Table>("celestial_bodies");

  const activeTab = DML_TABS.find(t=>t.id===dmlTab)!;

  return (
    <div className="fade-in-up space-y-5 max-w-4xl">

      {/* ── Page header ─────────────────────── */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-1.5 rounded-lg" style={{background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)"}}>
            <Pencil size={16} style={{color:"var(--accent-purple)"}}/>
          </div>
          <h1 className="text-xl font-bold" style={{color:"var(--text-primary)"}}>Modify Database</h1>
        </div>
        <p className="text-sm" style={{color:"var(--text-muted)"}}>
          Manage records with safe forms and explore data with read-only SQL
        </p>
      </div>

      {/* ── Table selector (hidden on rawsql) ─ */}
      {dmlTab !== "rawsql" && (
        <div className="flex gap-2 p-1 rounded-xl" style={{background:"rgba(4,6,18,0.7)",border:"1px solid rgba(34,211,238,0.12)"}}>
          {(["celestial_bodies","observations"] as Table[]).map(t=>{
            const Icon = t==="celestial_bodies" ? Globe : Telescope;
            const active = table===t;
            return (
              <button key={t} id={`tab-${t}`}
                onClick={()=>setTable(t)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all text-sm font-semibold"
                style={{
                  background: active ? "linear-gradient(135deg,rgba(34,211,238,0.15),rgba(34,211,238,0.05))" : "transparent",
                  border: active ? "1px solid rgba(34,211,238,0.25)" : "1px solid transparent",
                  color: active ? "var(--accent-cyan)" : "var(--text-muted)",
                  boxShadow: active ? "0 0 14px rgba(34,211,238,0.08)" : "none",
                }}>
                <Icon size={14}/>{t.replace("_"," ")}
              </button>
            );
          })}
        </div>
      )}

      {/* ── DML operation tabs ──────────────── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{background:"rgba(4,6,18,0.7)",border:"1px solid rgba(255,255,255,0.05)"}}>
        {DML_TABS.map(({id,label,icon:Icon,accent})=>{
          const active = dmlTab===id;
          return (
            <button key={id} id={`dml-tab-${id}`}
              onClick={()=>setDmlTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all text-sm font-semibold"
              style={{
                background: active ? `rgba(${accent==="var(--accent-cyan)"?"34,211,238":accent==="var(--accent-purple)"?"139,92,246":accent==="#f87171"?"239,68,68":"74,222,128"},0.1)` : "transparent",
                border: active ? `1px solid ${accent}40` : "1px solid transparent",
                color: active ? accent : "var(--text-muted)",
                boxShadow: active ? `0 0 12px ${accent}20` : "none",
              }}>
              <Icon size={13}/>{label}
            </button>
          );
        })}
      </div>

      {/* ── Active tab panel ────────────────── */}
      <div className="hud-panel p-6 relative overflow-hidden hud-scanline">
        {/* Neon top glow line */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,height:"1px",
          background:`linear-gradient(90deg,transparent,${activeTab.accent}80,transparent)`,
        }}/>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 rounded-lg" style={{
            background:`rgba(${activeTab.accent==="var(--accent-cyan)"?"34,211,238":activeTab.accent==="var(--accent-purple)"?"139,92,246":activeTab.accent==="#f87171"?"239,68,68":"74,222,128"},0.1)`,
            border:`1px solid ${activeTab.accent}30`,
          }}>
            <activeTab.icon size={15} style={{color:activeTab.accent}}/>
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{color:activeTab.accent}}>
              {activeTab.label === "Raw SQL" ? "Raw SQL Executor" : `${activeTab.label} Record`}
            </h2>
            {dmlTab !== "rawsql" && (
              <p className="text-xs" style={{color:"var(--text-muted)"}}>
                Table: <code style={{color:"var(--accent-cyan)",fontFamily:"var(--font-geist-mono)"}}>{table}</code>
              </p>
            )}
          </div>
        </div>

        {dmlTab==="insert"  && <InsertTab  key={table} table={table} />}
        {dmlTab==="update"  && <UpdateTab  key={table} table={table} />}
        {dmlTab==="delete"  && <DeleteTab  key={table} table={table} />}
        {dmlTab==="rawsql"  && <RawSqlTab />}
      </div>
    </div>
  );
}
