"use client";

import { useState } from "react";
import {
  Pencil,
  Globe,
  Telescope,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Loader2,
} from "lucide-react";

type ActiveForm = "celestial_bodies" | "observations";

interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "textarea" | "datetime-local";
  placeholder?: string;
  required?: boolean;
}

const CELESTIAL_FIELDS: FormField[] = [
  { name: "name", label: "Name", type: "text", placeholder: "e.g. Kepler-452b", required: true },
  { name: "spectral_type", label: "Spectral Type", type: "text", placeholder: "e.g. G2V" },
  { name: "mass", label: "Mass (kg)", type: "number", placeholder: "e.g. 1.9885e30" },
  { name: "distance_ly", label: "Distance (light-years)", type: "number", placeholder: "e.g. 1400" },
  { name: "constellation", label: "Constellation", type: "text", placeholder: "e.g. Cygnus" },
  { name: "discovered_at", label: "Discovery Date", type: "date" },
];

const OBSERVATION_FIELDS: FormField[] = [
  { name: "body_id", label: "Celestial Body ID", type: "number", placeholder: "e.g. 1", required: true },
  { name: "observed_at", label: "Observed At", type: "datetime-local" },
  { name: "observer", label: "Observer Name", type: "text", placeholder: "e.g. Dr. Chen" },
  { name: "instrument", label: "Instrument", type: "text", placeholder: "e.g. Spectrometer X-7" },
  { name: "notes", label: "Notes", type: "textarea", placeholder: "Detailed observation notes..." },
];

export default function ModifyPage() {
  const [activeForm, setActiveForm] = useState<ActiveForm>("celestial_bodies");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; row?: Record<string, unknown> } | null>(null);

  const currentFields = activeForm === "celestial_bodies" ? CELESTIAL_FIELDS : OBSERVATION_FIELDS;

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(formData)) {
      if (v !== "") {
        const field = currentFields.find((f) => f.name === k);
        if (field?.type === "number") {
          payload[k] = Number(v);
        } else {
          payload[k] = v;
        }
      }
    }

    try {
      const res = await fetch(`/api/tables/${activeForm}/modify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Insert failed");
      setResult({ success: true, message: "Record inserted successfully!", row: json.row });
      setFormData({});
    } catch (e: unknown) {
      setResult({
        success: false,
        message: e instanceof Error ? e.message : "An unknown error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in-up space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Pencil size={20} style={{ color: "var(--accent-blue)" }} />
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Modify Database
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Insert new records into the stellar archive
        </p>
      </div>

      {/* Table selector tabs */}
      <div
        className="flex gap-2 p-1 rounded-xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {(["celestial_bodies", "observations"] as ActiveForm[]).map((t) => {
          const Icon = t === "celestial_bodies" ? Globe : Telescope;
          const isActive = activeForm === t;
          return (
            <button
              key={t}
              id={`tab-${t}`}
              onClick={() => {
                setActiveForm(t);
                setFormData({});
                setResult(null);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-200 text-sm font-semibold"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, var(--accent-blue), #3563d8)"
                  : "transparent",
                color: isActive ? "white" : "var(--text-muted)",
                boxShadow: isActive ? "0 2px 12px rgba(74,125,255,0.3)" : "none",
              }}
            >
              <Icon size={15} />
              {t.replace("_", " ")}
            </button>
          );
        })}
      </div>

      {/* Form card */}
      <div className="glass-card nebula-gradient p-6">
        <div className="flex items-center gap-2 mb-6">
          {activeForm === "celestial_bodies" ? (
            <Globe size={18} style={{ color: "var(--accent-cyan)" }} />
          ) : (
            <Telescope size={18} style={{ color: "var(--accent-purple)" }} />
          )}
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            INSERT INTO{" "}
            <code
              className="text-sm px-2 py-0.5 rounded"
              style={{
                background: "rgba(74,125,255,0.1)",
                color: "var(--accent-blue)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              {activeForm}
            </code>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentFields.map((field) => (
              <div
                key={field.name}
                className={field.type === "textarea" ? "sm:col-span-2" : ""}
              >
                <label
                  htmlFor={`field-${field.name}`}
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {field.label}
                  {field.required && (
                    <span style={{ color: "#ef4444" }}> *</span>
                  )}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={`field-${field.name}`}
                    className="stellar-input resize-none"
                    rows={4}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                  />
                ) : (
                  <input
                    id={`field-${field.name}`}
                    type={field.type}
                    className="stellar-input"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    step={field.type === "number" ? "any" : undefined}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center gap-4">
            <button
              type="submit"
              id="btn-insert-record"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Pencil size={14} />
              )}
              {loading ? "Inserting..." : "Execute INSERT"}
            </button>

            <button
              type="button"
              onClick={() => { setFormData({}); setResult(null); }}
              style={{ color: "var(--text-muted)", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer" }}
            >
              Clear form
            </button>
          </div>
        </form>

        {/* Result banner */}
        {result && (
          <div
            className="mt-6 p-4 rounded-lg fade-in-up"
            style={{
              background: result.success
                ? "rgba(74, 222, 128, 0.08)"
                : "rgba(239, 68, 68, 0.08)",
              border: `1px solid ${result.success ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)"}`,
            }}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle
                  size={18}
                  style={{ color: "#4ade80", marginTop: "1px", flexShrink: 0 }}
                />
              ) : (
                <AlertTriangle
                  size={18}
                  style={{ color: "#ef4444", marginTop: "1px", flexShrink: 0 }}
                />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{ color: result.success ? "#4ade80" : "#ef4444" }}
                >
                  {result.message}
                </p>
                {result.row && (
                  <pre
                    className="text-xs mt-2 overflow-x-auto"
                    style={{
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-geist-mono)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {JSON.stringify(result.row, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SQL preview */}
      <div className="glass-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          SQL Preview
        </p>
        <pre
          className="text-xs overflow-x-auto"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-geist-mono)",
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: "var(--accent-blue)" }}>INSERT INTO </span>
          <span style={{ color: "var(--accent-cyan)" }}>{activeForm}</span>
          {" ("}
          <span style={{ color: "#a78bfa" }}>
            {currentFields.map((f) => f.name).join(", ")}
          </span>
          {")\n"}
          <span style={{ color: "var(--accent-blue)" }}>VALUES </span>
          {"("}
          <span style={{ color: "var(--accent-gold)" }}>
            {currentFields.map((_, i) => `$${i + 1}`).join(", ")}
          </span>
          {")\n"}
          <span style={{ color: "var(--accent-blue)" }}>RETURNING </span>
          <span style={{ color: "var(--accent-cyan)" }}>*</span>
          {";"}
        </pre>
      </div>
    </div>
  );
}
