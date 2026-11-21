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
  const [email, setEmail] = useState("admin@docket.local");
  const [password, setPassword] = useState("Docket123!");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">
            <Layers size={24} />
          </span>
          docket<span className="brand-period">.</span>
        </div>
        <div className="login-story-content">
          <span className="eyebrow">A PLACE FOR EVERY DOCUMENT</span>
          <h1>
            Good work starts
            <br />
            with a little
            <br />
            <em>clarity.</em>
          </h1>
          <p>
            Your teamΓÇÖs knowledge, organized.
            <br />
            Your next document, already within reach.
          </p>
          <div className="login-features">
            <span>
              <FolderOpen size={19} />
              One organized workspace
            </span>
            <span>
              <ShieldCheck size={19} />
              The right access, for the right people
            </span>
            <span>
              <Files size={19} />
              Less searching. More doing.
            </span>
          </div>
        </div>
        <div className="login-story-footer">
          Built for teams. Made to keep things simple.
        </div>
      </section>
      <section className="login-form-side">
        <div className="login-form-wrap">
          <span className="login-tag">
            <span />
            YOUR TEAMΓÇÖS SHARED SPACE
          </span>
          <h2>Welcome back.</h2>
          <p>Sign in and pick up where you left off.</p>
          <form onSubmit={submit}>
            <ErrorMessage message={error} />
            <label>
              Email address
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </label>
            <button disabled={busy} className="button primary login-submit">
              {busy ? "Signing inΓÇª" : "Sign in to Docket"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="demo-login">
            <span className="eyebrow">EXPLORE THE LOCAL PREVIEW</span>
            <p>
              Choose a demo role. Password: <code>Docket123!</code>
            </p>
            <div>
              {["admin", "head", "employee"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setEmail(`${role}@docket.local`);
                    setPassword("Docket123!");
                  }}
                  className={email.startsWith(role + "@") ? "selected" : ""}
                >
                  {role === "admin"
                    ? "Administrator"
                    : role === "head"
                      ? "Department head"
                      : "Employee"}
                </button>
              ))}
            </div>
            <small>Demo data and uploads are stored on this computer.</small>
          </div>
          <p className="login-help">
            Need an account? Contact your workspace administrator.
          </p>
        </div>
        <div className="login-copyright">
          Docket ┬╖ Your documents, together.
        </div>
      </section>
    </div>
  );
}
