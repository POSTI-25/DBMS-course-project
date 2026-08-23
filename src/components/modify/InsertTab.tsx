"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import QueryToast, { QueryResult } from "@/components/QueryToast";

type Table = "celestial_bodies" | "observations";

const FIELDS: Record<Table, { name:string; label:string; type:string; placeholder?:string; required?:boolean; span2?:boolean }[]> = {
  celestial_bodies: [
    { name:"name",          label:"Name",                type:"text",     placeholder:"e.g. Kepler-452b",      required:true },
    { name:"spectral_type", label:"Spectral Type",       type:"text",     placeholder:"e.g. G2V" },
    { name:"mass",          label:"Mass (kg)",           type:"number",   placeholder:"e.g. 1.9885e30" },
    { name:"distance_ly",   label:"Distance (ly)",       type:"number",   placeholder:"e.g. 1400" },
    { name:"constellation", label:"Constellation",       type:"text",     placeholder:"e.g. Cygnus" },
    { name:"discovered_at", label:"Discovery Date",      type:"date" },
  ],
  observations: [
    { name:"body_id",     label:"Celestial Body ID", type:"number",          placeholder:"e.g. 1",  required:true },
    { name:"observed_at", label:"Observed At",        type:"datetime-local" },
    { name:"observer",    label:"Observer Name",      type:"text",            placeholder:"e.g. Dr. Chen" },
    { name:"instrument",  label:"Instrument",         type:"text",            placeholder:"e.g. Spectrometer X-7" },
    { name:"notes",       label:"Notes",              type:"textarea",        placeholder:"Detailed observation notes...", span2:true },
  ],
};

export default function InsertTab({ table }: { table: Table }) {
  const [form, setForm] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const fields = FIELDS[table];

  const handle = (k:string, v:string) => { setForm(p => ({...p,[k]:v})); setResult(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setResult(null);
    const payload: Record<string,unknown> = {};
    for (const [k,v] of Object.entries(form)) {
      if (v==="") continue;
      const f = fields.find(x=>x.name===k);
      payload[k] = f?.type==="number" ? Number(v) : v;
    }
    try {
      const r = await fetch(`/api/tables/${table}/modify`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Insert failed");
      setResult({ success:true, message:"Record inserted successfully!", row:j.row, rowsAffected:j.rowsAffected, queryTime:j.queryTime });
      setForm({});
    } catch(e:unknown) {
      setResult({ success:false, message: e instanceof Error ? e.message : "Unknown error" });
    } finally { setLoading(false); }
  };

  const cols = fields.map(f=>f.name);
  const vals = cols.map((_,i)=>`$${i+1}`);

  return (
    <div>
      <div className="mb-4 p-3 rounded-lg" style={{ background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.12)" }}>
        <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color:"rgba(34,211,238,0.5)" }}>SQL Preview</p>
        <code className="text-xs" style={{ fontFamily:"var(--font-geist-mono)", color:"var(--text-secondary)" }}>
          <span style={{color:"var(--accent-cyan)"}}>INSERT INTO </span>
          <span style={{color:"var(--accent-purple)"}}>{table}</span>
          {" ("}<span style={{color:"#a78bfa"}}>{cols.join(", ")}</span>{")"}
          {"\nVALUES ("}
          <span style={{color:"var(--accent-gold)"}}>{vals.join(", ")}</span>
          {") RETURNING *;"}
        </code>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.name} className={f.span2 ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:"var(--text-secondary)"}}>
                {f.label}{f.required && <span style={{color:"#f87171"}}> *</span>}
              </label>
              {f.type==="textarea"
                ? <textarea id={`ins-${f.name}`} className="stellar-input resize-none" rows={3} placeholder={f.placeholder}
                    value={form[f.name]||""} onChange={e=>handle(f.name,e.target.value)} required={f.required} />
                : <input id={`ins-${f.name}`} type={f.type} className="stellar-input" placeholder={f.placeholder}
                    value={form[f.name]||""} onChange={e=>handle(f.name,e.target.value)} required={f.required}
                    step={f.type==="number"?"any":undefined} />}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" id="btn-insert-record" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
            {loading ? "Inserting…" : "Execute INSERT"}
          </button>
          <button type="button" onClick={()=>{setForm({}); setResult(null);}}
            style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"0.85rem"}}>
            Clear
          </button>
        </div>
      </form>

      {result && <QueryToast result={result} onClose={()=>setResult(null)} />}
    </div>
  );
}
