"use client";
import { useState } from "react";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { useUser } from "@/components/layout/workspace-shell";
import { useResource } from "@/hooks/use-resource";
import type { DocumentDto, ListResponse } from "@/lib/contracts";
import { ErrorMessage, Loading } from "@/components/ui/shared";
import { DocumentTable } from "@/components/documents/document-table";
import { api } from "@/lib/api-client";

export default function PendingApprovals() {
  const user = useUser();
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  const { data, error: fetchError, loading, refresh } = useResource<ListResponse<DocumentDto>>(
    "/documents?status=pending&pageSize=50"
  );

  if (user.role === "EMPLOYEE") {
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">ACCESS DENIED</div>
            <h1>Pending Approvals</h1>
            <p>This page is only available to department heads and administrators.</p>
          </div>
        </div>
      </>
    );
  }

  async function handleApprove(id: string) {
    setApproving(id);
    setError("");
    try {
      await api(`/documents/${id}/approve`, { method: "POST" });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApproving(null);
    }
  }

  const pending = data?.data || [];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">AWAITING YOUR REVIEW</div>
          <h1>Pending Approvals</h1>
          <p>Review and approve documents uploaded by your team members.</p>
        </div>
      </div>
      
      <ErrorMessage message={error || fetchError} />
      {loading && <Loading />}
      
      {!loading && pending.length === 0 && (
        <div className="empty-state">
          <Clock size={48} />
          <h2>No pending approvals</h2>
          <p>All documents have been reviewed. Great work!</p>
        </div>
      )}
      
      {!loading && pending.length > 0 && (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>{pending.length} document{pending.length !== 1 ? "s" : ""} awaiting approval</h2>
              <p>Review each document before approving it for your team.</p>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Document name</th>
                  <th>Department</th>
                  <th>Uploaded by</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <Link className="document-name" href={`/documents/${doc.id}`}>
                        <strong>{doc.title}</strong>
                        <small>{doc.file.name}</small>
                      </Link>
                    </td>
                    <td>
                      <span className={`department-badge dept-${doc.department.id.split("-").pop()}`}>
                        {doc.department.name}
                      </span>
                    </td>
                    <td>{doc.owner.name}</td>
                    <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="button small primary"
                          onClick={() => handleApprove(doc.id)}
                          disabled={approving === doc.id}
                        >
                          <CheckCircle2 size={16} />
                          {approving === doc.id ? "Approving..." : "Approve"}
                        </button>
                        <Link href={`/documents/${doc.id}`} className="button small">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
