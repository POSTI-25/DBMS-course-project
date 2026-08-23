"use client";
import { CheckCircle, AlertTriangle, Clock, X } from "lucide-react";

export interface QueryResult {
  success: boolean;
  message: string;
  row?: Record<string, unknown>;
  rowsAffected?: number | null;
  queryTime?: number;
}

export default function QueryToast({ result, onClose }: { result: QueryResult; onClose: () => void }) {
  const ok = result.success;
  return (
    <div className="fade-in-up mt-5 p-4 rounded-xl relative" style={{
      background: ok ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.06)",
      border: `1px solid ${ok ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)"}`,
    }}>
      <button onClick={onClose} style={{ position:"absolute", top:10, right:10, background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)" }}>
        <X size={14} />
      </button>
      <div className="flex items-start gap-3">
        {ok ? <CheckCircle size={17} style={{ color:"#4ade80", flexShrink:0, marginTop:1 }} />
             : <AlertTriangle size={17} style={{ color:"#f87171", flexShrink:0, marginTop:1 }} />}
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-sm font-semibold" style={{ color: ok ? "#4ade80" : "#f87171" }}>{result.message}</p>
          <div className="flex items-center gap-3 mt-1">
            {result.queryTime != null && (
              <span className="flex items-center gap-1 text-xs" style={{ color:"var(--text-muted)" }}>
                <Clock size={10} /> {result.queryTime}ms
              </span>
            )}
            {result.rowsAffected != null && (
              <span className="text-xs" style={{ color:"var(--text-muted)" }}>
                {result.rowsAffected} row{result.rowsAffected !== 1 ? "s" : ""} affected
              </span>
            )}
          </div>
          {result.row && (
            <pre className="text-xs mt-2 overflow-x-auto" style={{ color:"var(--text-secondary)", fontFamily:"var(--font-geist-mono)", whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
              {JSON.stringify(result.row, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
