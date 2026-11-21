"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Files,
  HardDrive,
  Building2,
  Tags,
  Folder,
} from "lucide-react";
import { useUser } from "@/components/layout/workspace-shell";
import { useResource } from "@/hooks/use-resource";
import type { DashboardDto } from "@/lib/contracts";
import { ErrorMessage, Loading } from "@/components/ui/shared";
import { DocumentTable } from "@/components/documents/document-table";
import { fileSize } from "@/lib/utils";
export default function Dashboard() {
  const user = useUser();
  const { data, error, loading } = useResource<{ data: DashboardDto }>(
    "/dashboard",
  );
  const d = data?.data;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR WORKSPACE, AT A GLANCE</div>
          <h1>
            Good to see you, {user.name.split(" ")[0]}
            <span className="greeting-dot">.</span>
          </h1>
          <p>Everything your team needs, right where it belongs.</p>
        </div>
        <Link href="/documents/upload" className="button primary">
          <Plus size={17} />
          Upload document
        </Link>
      </div>
      <ErrorMessage message={error} />
      {loading && <Loading />}
      {d && (
        <>
          <section className="stats-grid" aria-label="Workspace statistics">
            {[
              {
                label: "Total documents",
                value: d.documentCount,
                icon: Files,
                note: "Organized and accessible",
              },
              {
                label: "Departments",
                value: d.departments.length,
                icon: Building2,
                note: "Connected in one workspace",
              },
              {
                label: "Document categories",
                value: d.categoryCount,
                icon: Tags,
                note: "A place for every file",
              },
              {
                label: "Storage used",
                value: fileSize(d.storageBytes),
                icon: HardDrive,
                note: "Across your visible documents",
              },
            ].map((s, i) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-top">
                  <span>{s.label}</span>
                  <s.icon size={18} />
                </div>
                <strong>{s.value}</strong>
                <small>
                  <span className={`stat-pip pip-${i}`} />
                  {s.note}
                </small>
              </div>
            ))}
          </section>
          <section className="welcome-banner">
            <div className="banner-copy">
              <span className="eyebrow">A CLEARER WAY TO WORK</span>
              <h2>
                Less clutter.
                <br />
                More clarity.
              </h2>
              <p>
                Bring your teamΓÇÖs documents together.
                <br />
                Find what matters, and get back to doing.
              </p>
              <Link href="/documents">
                Explore your documents <ArrowRight size={17} />
              </Link>
            </div>
            <div className="paper-scene" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <span className="scene-spark spark-one">Γ£ª</span>
              <span className="scene-spark spark-two">+</span>
              <div className="paper paper-back" />
              <div className="paper paper-front">
                <span className="paper-logo">
                  <Files size={21} />
                </span>
                <div className="paper-line dark" />
                <div className="paper-line" />
                <div className="paper-line short" />
                <span className="paper-chip">
                  All in one place <span>Γ£ô</span>
                </span>
                <div className="paper-line" />
                <div className="paper-line short" />
              </div>
              <span className="floating-check">Γ£ô</span>
              <span className="floating-label">
                <Folder size={14} /> Made for teamwork
              </span>
            </div>
          </section>
          <section className="section-block">
            <div className="section-title">
              <div>
                <h2>Browse by department</h2>
                <p>A shared space for every team.</p>
              </div>
              <Link href="/documents" className="text-link">
                View all documents <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="department-grid">
              {d.departments.map((dep, i) => (
                <Link
                  key={dep.id}
                  href={`/documents?departmentId=${dep.id}`}
                  className="department-card"
                >
                  <span className={`folder-tile folder-${i % 4}`}>
                    <Folder size={23} />
                  </span>
                  <ArrowUpRight className="department-arrow" size={17} />
                  <h3>{dep.name}</h3>
                  <p>
                    {dep.count} document{dep.count !== 1 ? "s" : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
          <section className="panel recent-panel">
            <div className="panel-heading">
              <div>
                <h2>Recently added</h2>
                <p>The latest additions to your workspace.</p>
              </div>
              <Link href="/documents" className="text-link">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            <DocumentTable documents={d.recentDocuments} />
          </section>
        </>
      )}
    </>
  );
}
