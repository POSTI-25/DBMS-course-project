"use client";

import { useState } from "react";
import { Loader2, Play, Clock, Table } from "lucide-react";

const SNIPPETS = [
  { label:"SELECT all bodies", sql:"SELECT * FROM celestial_bodies ORDER BY body_id;" },
  { label:"COUNT observations", sql:"SELECT COUNT(*) FROM observations;" },
  { label:"JOIN bodies + obs", sql:`SELECT cb.name, o.observed_at, o.observer\nFROM observations o\nJOIN celestial_bodies cb ON cb.body_id = o.body_id\nORDER BY o.observed_at DESC;` },
  { label:"Schema columns", sql:`SELECT table_name, column_name, data_type\nFROM information_schema.columns\nWHERE table_schema = 'public'\nORDER BY table_name, ordinal_position;` },
];

interface RawResult {
  rows: Record<string,unknown>[];
  rowCount: number | null;
  command: string;
  queryTime: number;
}

export default function RawSqlTab() {
  const [sql, setSql]           = useState("SELECT * FROM celestial_bodies;");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<RawResult|null>(null);
  const [error, setError]       = useState<string|null>(null);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch("/api/rawsql", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ sql }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Query failed");
      setResult(j);
    } catch(e:unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally { setLoading(false); }
  };

  const cols = result && result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

  return (
    <div className="space-y-4">
      {/* Quick snippets */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{color:"rgba(34,211,238,0.4)"}}>Quick Snippets</p>
        <div className="flex flex-wrap gap-2">
          {SNIPPETS.map(s=>(
            <button key={s.label} onClick={()=>{setSql(s.sql);setResult(null);setError(null);}}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{background:"rgba(34,211,238,0.06)",border:"1px solid rgba(34,211,238,0.2)",color:"var(--accent-cyan)",cursor:"pointer"}}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{position:"relative"}}>
        <div className="absolute top-3 left-3 text-[10px] uppercase tracking-widest font-bold" style={{color:"rgba(34,211,238,0.35)"}}>SQL</div>
        <textarea
          id="raw-sql-input"
          className="stellar-input resize-none"
          rows={6}
          value={sql}
          onChange={e=>{setSql(e.target.value);setResult(null);setError(null);}}
          style={{paddingTop:"2rem",fontFamily:"var(--font-geist-mono)",fontSize:"0.82rem",lineHeight:1.7}}
          spellCheck={false}
          placeholder="SELECT * FROM celestial_bodies;"
        />
      </div>

      {/* Run button */}
      <div className="flex items-center gap-3">
        <button id="btn-run-sql" onClick={run} disabled={loading||!sql.trim()} className="btn-primary"
          style={{background:"linear-gradient(135deg,#065f46,#047857)",border:"1px solid rgba(52,211,153,0.4)"}}>
          {loading ? <Loader2 size={14} className="animate-spin"/> : <Play size={14}/>}
          {loading ? "Running…" : "Run Query"}
        </button>
        {result && (
          <div className="flex items-center gap-3 text-xs" style={{color:"var(--text-muted)"}}>
            <span className="flex items-center gap-1"><Clock size={11}/> {result.queryTime}ms</span>
            <span className="badge badge-cyan">{result.command}</span>
            <span>{result.rowCount ?? result.rows.length} row{result.rowCount!==1?"s":""}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl fade-in-up" style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.25)"}}>
          <p className="text-xs font-bold mb-1" style={{color:"#f87171"}}>Query Error</p>
          <pre className="text-xs" style={{color:"#fca5a5",fontFamily:"var(--font-geist-mono)",whiteSpace:"pre-wrap"}}>{error}</pre>
        </div>
      )}

      {/* Results table */}
      {result && result.rows.length > 0 && (
        <div className="hud-panel overflow-hidden fade-in-up">
          <div className="flex items-center gap-2 px-4 py-2.5" style={{borderBottom:"1px solid rgba(34,211,238,0.12)"}}>
            <Table size={13} style={{color:"var(--accent-cyan)"}}/>
            <p className="text-xs font-bold uppercase tracking-widest" style={{color:"var(--accent-cyan)"}}>
              Result · {result.rows.length} rows · {cols.length} cols
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>{cols.map(c=><th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.map((row,i)=>(
                  <tr key={i}>
                    {cols.map(c=>(
                      <td key={c} title={String(row[c]??"")}>
                        {row[c]===null ? <span style={{color:"var(--text-muted)",fontStyle:"italic"}}>NULL</span> : String(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && result.rows.length === 0 && (
        <div className="p-4 rounded-xl text-center fade-in-up" style={{background:"rgba(34,211,238,0.04)",border:"1px solid rgba(34,211,238,0.12)"}}>
          <p className="text-sm font-semibold" style={{color:"#4ade80"}}>
            ✓ Query executed — {result.command}, {result.rowCount ?? 0} row{result.rowCount!==1?"s":""} affected
          </p>
        </div>
      )}
    </div>
  );
}
