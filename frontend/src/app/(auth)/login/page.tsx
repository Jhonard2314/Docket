"use client";
import { useState } from "react";
import {
  Layers,
  ArrowRight,
  Files,
  ShieldCheck,
  FolderOpen,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { ErrorMessage } from "@/components/ui/shared";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      window.location.assign("/dashboard");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="login-page">

      {/* ── Left story panel ───────────────────────────────────────────── */}
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark"><Layers size={24} /></span>
          docket<span className="brand-period">.</span>
        </div>

        <div className="login-story-content">
          <span className="eyebrow">A PLACE FOR EVERY DOCUMENT</span>
          <h1>
            Good work starts<br />
            with a little<br />
            <em>clarity.</em>
          </h1>
          <p style={{ marginTop: "1rem", lineHeight: 1.7, fontSize: "15px" }}>
            Your team&apos;s knowledge, organized.<br />
            Your next document, already within reach.
          </p>
          <div className="login-features" style={{ marginTop: "2rem" }}>
            <span><FolderOpen size={18} /> One organized workspace</span>
            <span><ShieldCheck size={18} /> The right access, for the right people</span>
            <span><Files size={18} /> Less searching. More doing.</span>
          </div>
        </div>

        <div className="login-story-footer">
          Built for teams. Made to keep things simple.
        </div>
      </section>

      {/* ── Right form panel ───────────────────────────────────────────── */}
      <section className="login-form-side">
        <div className="login-form-wrap">

          <span className="login-tag">
            <span />YOUR TEAM&apos;S SHARED SPACE
          </span>

          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.5rem", letterSpacing: "-0.5px" }}>
            Welcome back.
          </h2>
          <p style={{ color: "var(--muted)", marginTop: "0.4rem", marginBottom: "2rem", fontSize: "14px" }}>
            Sign in and pick up where you left off.
          </p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <ErrorMessage message={error} />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--muted)" }}>
                Email address
              </label>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{ padding: "0.7rem 0.9rem", fontSize: "15px", borderRadius: "8px", border: "1.5px solid var(--border)", outline: "none", width: "100%" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--muted)" }}>
                Password
              </label>
              <div className="password-field">
                <input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: "0.7rem 0.9rem", fontSize: "15px" }}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              disabled={busy}
              className="button primary login-submit"
              style={{ marginTop: "0.25rem", padding: "0.8rem 1.25rem", fontSize: "15px", fontWeight: 600 }}
            >
              {busy ? "Signing in…" : "Sign in to Docket"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="login-help" style={{ marginTop: "2rem", fontSize: "13px" }}>
            Need an account? Contact your workspace administrator.
          </p>
        </div>

        <div className="login-copyright">Docket · Your documents, together.</div>
      </section>
    </div>
  );
}
