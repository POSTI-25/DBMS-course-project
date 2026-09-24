"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Orbit } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Sign in failed.");
      router.replace("/dashboard/contents"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign in failed."); }
    finally { setBusy(false); }
  }

  return <main className="login-page">
    <div className="login-intro"><div className="brand-mark"><Orbit size={27} /></div><p className="eyebrow">Stellar Archive / DBMS</p><h1>Explore the data behind the sky.</h1><p>Browse astronomical records, inspect PostgreSQL structure, and manage observations in one workspace.</p><div className="login-orbit" aria-hidden="true"><span /></div></div>
    <section className="login-card" aria-labelledby="login-title"><div className="login-icon"><LockKeyhole size={20}/></div><p className="eyebrow">Secure access</p><h2 id="login-title">Sign in to the archive</h2><p className="login-copy">Use the account created during database setup.</p><form onSubmit={submit}><label htmlFor="username">Username</label><input id="username" className="stellar-input" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required /><label htmlFor="password">Password</label><input id="password" type="password" className="stellar-input" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /><button className="btn-primary login-submit" disabled={busy}>{busy ? "Signing in…" : "Enter workspace"}<ArrowRight size={16}/></button>{error && <p role="alert" className="login-error">{error}</p>}</form></section>
  </main>;
}
