"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Save } from "lucide-react";
import QueryToast, { QueryResult } from "@/components/QueryToast";

type Table = "celestial_bodies" | "observations";
const PK: Record<Table,string> = { celestial_bodies:"body_id", observations:"obs_id" };

const FIELDS: Record<Table, { name:string; label:string; type:string; placeholder?:string; span2?:boolean }[]> = {
  celestial_bodies: [
    { name:"name",          label:"Name",          type:"text",   placeholder:"Body name" },
    { name:"spectral_type", label:"Spectral Type", type:"text",   placeholder:"e.g. G2V" },
    { name:"mass",          label:"Mass (kg)",     type:"number", placeholder:"e.g. 1.9885e30" },
    { name:"distance_ly",   label:"Distance (ly)", type:"number", placeholder:"e.g. 4.24" },
    { name:"constellation", label:"Constellation", type:"text",   placeholder:"e.g. Orion" },
    { name:"discovered_at", label:"Discovery Date",type:"date" },
  ],
  observations: [
    { name:"body_id",     label:"Celestial Body ID", type:"number" },
    { name:"observed_at", label:"Observed At",        type:"datetime-local" },
    { name:"observer",    label:"Observer",           type:"text" },
    { name:"instrument",  label:"Instrument",         type:"text" },
    { name:"notes",       label:"Notes",              type:"textarea", span2:true },
  ],
};

export default function UpdateTab({ table }: { table: Table }) {
  const pkCol = PK[table];
  const fields = FIELDS[table];

  const [rows, setRows]       = useState<Record<string,unknown>[]>([]);
  const [loadingRows, setLR]  = useState(false);
  const [selectedPk, setSel]  = useState<string>("");
  const [form, setForm]       = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<QueryResult|null>(null);

  const fetchRows = async () => {
    setLR(true);
    try {
      const r = await fetch(`/api/tables/${table}/contents`);
      const j = await r.json();
      setRows(j.rows ?? []);
    } finally { setLR(false); }
  };

  useEffect(() => { fetchRows(); }, [table]);

  const pick = (pkVal: string) => {
    setSel(pkVal); setResult(null);
    const row = rows.find(r => String(r[pkCol]) === pkVal);
    if (!row) return;
    const f: Record<string,string> = {};
    for (const [k,v] of Object.entries(row)) {
      if (k === pkCol) continue;
      if (v === null || v === undefined) { f[k]=""; continue; }
      // format datetime for input
      if (typeof v==="string" && /^\d{4}-\d{2}-\d{2}T/.test(v))
        f[k] = v.slice(0,16);
      else if (typeof v==="string" && /^\d{4}-\d{2}-\d{2}/.test(v))
        f[k] = v.slice(0,10);
      else f[k] = String(v);
    }
    setForm(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setResult(null);
    const payload: Record<string,unknown> = { [pkCol]: Number(selectedPk) };
    for (const [k,v] of Object.entries(form)) {
      const fd = fields.find(x=>x.name===k);
      payload[k] = fd?.type==="number" ? (v===""?null:Number(v)) : (v===""?null:v);
    }
    try {
      const r = await fetch(`/api/tables/${table}/modify`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error||"Update failed");
      setResult({ success:true, message:`Record updated (${pkCol}=${selectedPk})`, row:j.row, rowsAffected:j.rowsAffected, queryTime:j.queryTime });
      fetchRows();
    } catch(e:unknown) {
      setResult({ success:false, message: e instanceof Error ? e.message : "Unknown error" });
    } finally { setLoading(false); }
  };

  const setCols = Object.keys(form);
  const sqlPreview = selectedPk
    ? `UPDATE ${table}\nSET ${setCols.map((c,i)=>`${c} = $${i+1}`).join(", ")}\nWHERE ${pkCol} = $${setCols.length+1}\nRETURNING *;`
    : `-- Select a record to generate UPDATE preview`;

  return (
    <div className="space-y-4">
      {/* Row selector */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <select className="stellar-input appearance-none cursor-pointer" value={selectedPk}
            onChange={e=>pick(e.target.value)} style={{paddingRight:"2.5rem"}}>
            <option value="">— Select a record to update —</option>
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
      <div className="p-3 rounded-lg" style={{background:"rgba(34,211,238,0.04)",border:"1px solid rgba(34,211,238,0.12)"}}>
        <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{color:"rgba(34,211,238,0.5)"}}>SQL Preview</p>
        <pre className="text-xs" style={{fontFamily:"var(--font-geist-mono)",color:"var(--text-secondary)",whiteSpace:"pre-wrap"}}>
          <span style={{color:"var(--accent-cyan)"}}>{sqlPreview.split("\n")[0]}</span>
          {"\n"}{sqlPreview.split("\n").slice(1).join("\n")}
        </pre>
      </div>

      {selectedPk && (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f=>(
              <div key={f.name} className={f.span2?"sm:col-span-2":""}>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:"var(--text-secondary)"}}>
                  {f.label}
                </label>
                {f.type==="textarea"
                  ? <textarea className="stellar-input resize-none" rows={3}
                      value={form[f.name]??""} onChange={e=>setForm(p=>({...p,[f.name]:e.target.value}))} />
                  : <input type={f.type} className="stellar-input"
                      value={form[f.name]??""} onChange={e=>setForm(p=>({...p,[f.name]:e.target.value}))}
                      step={f.type==="number"?"any":undefined} />}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" id="btn-update-record" disabled={loading} className="btn-primary"
              style={{background:"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"1px solid rgba(139,92,246,0.4)"}}>
              {loading ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
              {loading ? "Updating…" : "Execute UPDATE"}
            </button>
          </div>
        </form>
      )}

      {result && <QueryToast result={result} onClose={()=>setResult(null)} />}
    </div>
  );
}
