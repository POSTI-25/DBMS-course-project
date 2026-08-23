"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Trash2, AlertTriangle, X } from "lucide-react";
import QueryToast, { QueryResult } from "@/components/QueryToast";

type Table = "celestial_bodies" | "observations";
const PK: Record<Table,string> = { celestial_bodies:"body_id", observations:"obs_id" };

export default function DeleteTab({ table }: { table: Table }) {
  const pkCol = PK[table];
  const [rows, setRows]         = useState<Record<string,unknown>[]>([]);
  const [loadingRows, setLR]    = useState(false);
  const [selectedPk, setSel]    = useState<string>("");
  const [showModal, setModal]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<QueryResult|null>(null);

  const fetchRows = async () => {
    setLR(true);
    try {
      const r = await fetch(`/api/tables/${table}/contents`);
      const j = await r.json();
      setRows(j.rows ?? []);
    } finally { setLR(false); }
  };

  useEffect(() => { fetchRows(); }, [table]);

  const selectedRow = rows.find(r=>String(r[pkCol])===selectedPk);

  const doDelete = async () => {
    setLoading(true); setModal(false); setResult(null);
    try {
      const r = await fetch(`/api/tables/${table}/modify`, {
        method:"DELETE", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ [pkCol]: Number(selectedPk) })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error||"Delete failed");
      setResult({ success:true, message:`Record deleted (${pkCol}=${selectedPk})`, row:j.row, rowsAffected:j.rowsAffected, queryTime:j.queryTime });
      setSel("");
      fetchRows();
    } catch(e:unknown) {
      setResult({ success:false, message: e instanceof Error ? e.message : "Unknown error" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Selector */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <select className="stellar-input appearance-none cursor-pointer" value={selectedPk}
            onChange={e=>{ setSel(e.target.value); setResult(null); }} style={{paddingRight:"2.5rem"}}>
            <option value="">— Select a record to delete —</option>
            {rows.map(r=>{
              const pk = String(r[pkCol]);
              const label = table==="celestial_bodies" ? `#${pk} · ${String(r.name??"")}` : `#${pk} · body_id=${String(r.body_id??"")}`;
              return <option key={pk} value={pk}>{label}</option>;
            })}
          </select>
        </div>
        <button onClick={fetchRows} disabled={loadingRows} className="btn-primary" style={{padding:"10px 14px"}}>
          <RefreshCw size={14} className={loadingRows?"animate-spin":""} />
        </button>
      </div>

      {/* SQL preview */}
      <div className="p-3 rounded-lg" style={{background:"rgba(239,68,68,0.04)",border:"1px solid rgba(239,68,68,0.15)"}}>
        <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{color:"rgba(239,68,68,0.5)"}}>SQL Preview</p>
        <pre className="text-xs" style={{fontFamily:"var(--font-geist-mono)",color:"var(--text-secondary)"}}>
          <span style={{color:"#f87171"}}>DELETE FROM </span>
          <span style={{color:"var(--accent-purple)"}}>{table}</span>
          {`\nWHERE ${pkCol} = `}
          <span style={{color:"var(--accent-gold)"}}>{selectedPk||"$1"}</span>
          {"\nRETURNING *;"}
        </pre>
      </div>

      {/* Selected record preview */}
      {selectedRow && (
        <div className="p-4 rounded-xl" style={{background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.2)"}}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"#f87171"}}>Record to be deleted</p>
          <pre className="text-xs overflow-x-auto" style={{color:"var(--text-secondary)",fontFamily:"var(--font-geist-mono)",whiteSpace:"pre-wrap"}}>
            {JSON.stringify(selectedRow, null, 2)}
          </pre>
        </div>
      )}

      {selectedPk && (
        <button id="btn-delete-record" disabled={loading}
          onClick={()=>setModal(true)}
          className="btn-danger" style={{padding:"10px 20px",fontSize:"0.875rem"}}>
          {loading ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
          {loading ? "Deleting…" : "Execute DELETE"}
        </button>
      )}

      {result && <QueryToast result={result} onClose={()=>setResult(null)} />}

      {/* Confirm modal */}
      {showModal && (
        <>
          <div style={{position:"fixed",inset:0,background:"rgba(2,4,14,0.7)",backdropFilter:"blur(4px)",zIndex:100}} onClick={()=>setModal(false)} />
          <div style={{
            position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            width:"min(480px,90vw)",zIndex:101,
            background:"rgba(8,10,24,0.97)",
            border:"1px solid rgba(239,68,68,0.35)",
            borderRadius:16,padding:24,
            boxShadow:"0 0 40px rgba(239,68,68,0.2)",
          }}>
            <div style={{position:"absolute",top:12,right:12}}>
              <button onClick={()=>setModal(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)"}}>
                <X size={16}/>
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div style={{width:40,height:40,borderRadius:10,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <AlertTriangle size={20} style={{color:"#f87171"}}/>
              </div>
              <div>
                <p className="font-bold" style={{color:"var(--text-primary)"}}>Confirm Deletion</p>
                <p className="text-xs" style={{color:"var(--text-muted)"}}>This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm mb-4" style={{color:"var(--text-secondary)"}}>
              You are about to permanently delete record <strong style={{color:"#f87171"}}>{pkCol} = {selectedPk}</strong> from <strong style={{color:"var(--accent-cyan)"}}>{table}</strong>.
            </p>
            <div className="flex gap-3">
              <button onClick={doDelete} className="btn-danger flex-1" style={{justifyContent:"center",padding:"10px"}}>
                <Trash2 size={14}/> Confirm DELETE
              </button>
              <button onClick={()=>setModal(false)}
                style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid var(--border-accent)",background:"transparent",color:"var(--text-secondary)",cursor:"pointer",fontSize:"0.875rem"}}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
