"use client";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useUser } from "@/components/layout/workspace-shell";
import { useResource } from "@/hooks/use-resource";
import type { DocumentDto, ListResponse, NamedRef } from "@/lib/contracts";
import { DocumentTable } from "@/components/documents/document-table";
import { ErrorMessage, Loading } from "@/components/ui/shared";
function Documents() {
  const user = useUser();
  const params = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(params.get("q") || "");
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`/documents?${next}`, { scroll: false });
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (params.get("q") || "")) {
        const next = new URLSearchParams(params.toString());
        if (search) next.set("q", search);
        else next.delete("q");
        next.delete("page");
        router.replace(`/documents?${next}`, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, params, router]);
  const { data, error, loading } = useResource<ListResponse<DocumentDto>>(
    `/documents?${params.toString()}&pageSize=6`,
  );
  const cats = useResource<ListResponse<NamedRef>>("/categories?pageSize=100");
  const deps = useResource<ListResponse<NamedRef>>(
    "/admin/departments?pageSize=100",
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE TEAM LIBRARY</div>
          <h1>
            All documents<span className="greeting-dot">.</span>
          </h1>
          <p>
            A little organization goes a long way. Find, share, and keep things
            moving.
          </p>
        </div>
        <Link href="/documents/upload" className="button primary">
          <Plus size={17} />
          Upload document
        </Link>
      </div>
      <div className="panel">
        <div className="library-heading">
          <h2>
            Document library{" "}
            <span className="count-badge">{data?.pagination.total ?? "—"}</span>
          </h2>
          <span className="muted">Shared with your workspace</span>
        </div>
        <div className="filter-bar">
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Search documents"
              placeholder="Search by name or filename…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="filter-selects">
            <SlidersHorizontal size={16} />
            {user.role === "ADMIN" && (
              <select
                aria-label="Filter by department"
                value={params.get("departmentId") || ""}
                onChange={(e) => update("departmentId", e.target.value)}
              >
                <option value="">All departments</option>
                {deps.data?.data.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label="Filter by category"
              value={params.get("categoryId") || ""}
              onChange={(e) => update("categoryId", e.target.value)}
            >
              <option value="">All categories</option>
              {cats.data?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Sort documents"
              value={params.get("sort") || "newest"}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="titleAsc">Name: A–Z</option>
              <option value="titleDesc">Name: Z–A</option>
            </select>
          </div>
        </div>
        {params.toString() && (
          <button
            className="clear-filters"
            onClick={() => {
              setSearch("");
              router.replace("/documents");
            }}
          >
            <X size={13} />
            Clear filters
          </button>
        )}
        <ErrorMessage message={error || cats.error || deps.error} />
        {loading ? (
          <Loading />
        ) : (
          data && (
            <>
              <DocumentTable documents={data.data} />
              <div className="pagination">
                <span>
                  {data.pagination.total} document
                  {data.pagination.total !== 1 ? "s" : ""} · Page{" "}
                  {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <div>
                  <button
                    className="button secondary small"
                    disabled={data.pagination.page <= 1}
                    onClick={() =>
                      update("page", String(data.pagination.page - 1))
                    }
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    className="button secondary small"
                    disabled={
                      data.pagination.page >= data.pagination.totalPages
                    }
                    onClick={() =>
                      update("page", String(data.pagination.page + 1))
                    }
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )
        )}
      </div>
      <div className="subtle-note">
        <span className="status-dot" />
        Documents are visible to members of their department. Administrators can
        access all departments.
      </div>
    </>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Documents />
    </Suspense>
  );
}
