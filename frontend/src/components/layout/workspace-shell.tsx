"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState } from "react";
import {
  Layers,
  LayoutDashboard,
  Files,
  Users,
  Building2,
  Tags,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import type { CurrentUser } from "@/lib/contracts";
import { initials } from "@/lib/utils";
import { api } from "@/lib/api-client";
const UserContext = createContext<CurrentUser | null>(null);
export function useUser() {
  return useContext(UserContext)!;
}
export function WorkspaceShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const nav = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/documents", label: "All documents", icon: Files },
  ];
  const admin = [
    { href: "/admin/pending", label: "Pending approvals", icon: ShieldCheck },
    { href: "/admin/users", label: "Team members", icon: Users },
    { href: "/admin/departments", label: "Departments", icon: Building2 },
    { href: "/admin/categories", label: "Categories", icon: Tags },
  ];
  const item = (n: (typeof nav)[number]) => (
    <Link
      key={n.href}
      href={n.href}
      onClick={() => setOpen(false)}
      className={`nav-link ${pathname.startsWith(n.href) ? "active" : ""}`}
    >
      <n.icon size={18} />
      {n.label}
      {pathname.startsWith(n.href) && <span className="nav-dot" />}
    </Link>
  );
  return (
    <UserContext value={user}>
      <div className="workspace">
        {open && (
          <button
            className="nav-overlay"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
        )}
        <aside className={`sidebar ${open ? "is-open" : ""}`}>
          <Link href="/dashboard" className="brand">
            <span className="brand-mark">
              <Layers size={23} />
            </span>
            docket<span className="brand-period">.</span>
          </Link>
          <button
            className="mobile-close icon-button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
          <div className="workspace-label">
            <span className="workspace-icon">D</span>
            <div>
              Docket workspace<small>Document management</small>
            </div>
          </div>
          <p className="nav-label">WORKSPACE</p>
          <nav aria-label="Workspace">{nav.map(item)}</nav>
          {user.role === "ADMIN" && (
            <>
              <p className="nav-label admin-label">MANAGEMENT</p>
              <nav aria-label="Administration">{admin.map(item)}</nav>
            </>
          )}
          {user.role === "DEPARTMENT_HEAD" && (
            <>
              <p className="nav-label admin-label">DEPARTMENT</p>
              <nav aria-label="Department management">
                <Link
                  href="/admin/pending"
                  className={`nav-link ${pathname.startsWith("/admin/pending") ? "active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <ShieldCheck size={18} />
                  Pending approvals
                  {pathname.startsWith("/admin/pending") && <span className="nav-dot" />}
                </Link>
              </nav>
            </>
          )}
          <div className="sidebar-bottom">
            <button
              className="logout"
              onClick={async () => {
                try {
                  await api("/auth/logout", { method: "POST" });
                  window.location.assign("/login");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <LogOut size={16} /> Sign out
            </button>
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="mobile-menu icon-button"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
              >
                <Menu />
              </button>
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>
                {pathname.includes("admin")
                  ? "Management"
                  : pathname.includes("documents")
                    ? "Documents"
                    : "Overview"}
              </strong>
            </div>
            <div className="topbar-right">
              <span className="today">
                {new Date().toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="topbar-divider" />
              <div className="user-info">
                <strong>{user.name}</strong>
                <small>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role === "ADMIN"
                      ? "Administrator"
                      : user.role === "DEPARTMENT_HEAD"
                        ? "Department Head"
                        : "Employee"}
                  </span>
                  {user.department && ` · ${user.department.name}`}
                </small>
              </div>
              <span className="avatar">{initials(user.name)}</span>
            </div>
          </header>
          <main id="main-content">{children}</main>
        </div>
      </div>
    </UserContext>
  );
}
