"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Pencil,
  Trash2,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Tags,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { api } from "@/lib/api-client";
import type { DocumentDto, ListResponse, NamedRef } from "@/lib/contracts";
import { FileIcon, Loading, ErrorMessage, Modal } from "@/components/ui/shared";
import { dateLabel, fileSize } from "@/lib/utils";
export default function DocumentDetails({ id }: { id: string }) {
  const { data, error, loading, refresh } = useResource<{ data: DocumentDto }>(
    `/documents/${id}`,
  );
  const cats = useResource<ListResponse<NamedRef>>("/categories?pageSize=100");
  const [modal, setModal] = useState<"edit" | "delete" | null>(null);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const doc = data?.data;
  async function edit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    try {
      const form = new FormData(e.currentTarget);
      await api(`/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(form)),
      });
      setModal(null);
      refresh();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setFailure("");
    try {
      await api(`/documents/${id}`, { method: "DELETE" });
      router.push("/documents");
    } catch (e) {
      setFailure((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <>
      <Link href="/documents" className="back-link">
        <ArrowLeft size={16} />
        Back to documents
      </Link>
      <ErrorMessage message={error} />
      {loading && <Loading />}
      {doc && (
        <>
          {params.has("uploaded") && (
            <div className="success-banner" role="status">
              <CheckCircle2 size={18} />
              Document uploaded successfully. Your team can now find it in the
              library.
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">DOCUMENT DETAILS</div>
              <h1>{doc.title}</h1>
              <p>Everything you need to know about this document.</p>
            </div>
            <a
              href={`/api/documents/${id}/download`}
              className="button primary"
            >
              <Download size={17} />
              Download file
            </a>
          </div>
          <div className="detail-layout">
            <div className="panel detail-main">
              <div className="file-summary">
                <FileIcon name={doc.file.name} />
                <div>
                  <h2>{doc.file.name}</h2>
                  <p>
                    {fileSize(doc.file.sizeBytes)} <span>┬╖</span>{" "}
                    {doc.file.name.split(".").pop()?.toUpperCase()} document
                  </p>
                </div>
                <span className="ready-badge">
                  <span />
                  Available
                </span>
              </div>
              <div className="description-block">
                <h3>About this document</h3>
                <p>{doc.description || "No description provided."}</p>
              </div>
              <div className="file-download-block">
                <Download size={28} />
                <h3>Ready when you are.</h3>
                <p>Download the original file to view it on your device.</p>
                <a
                  className="button secondary"
                  href={`/api/documents/${id}/download`}
                >
                  Download document
                  <ArrowLeft className="rotate-arrow" size={16} />
                </a>
              </div>
            </div>
            <aside>
              <div className="panel metadata-panel">
                <h2>File information</h2>
                {[
                  {
                    icon: Building2,
                    label: "Department",
                    value: doc.department.name,
                  },
                  { icon: Tags, label: "Category", value: doc.category.name },
                  { icon: User, label: "Uploaded by", value: doc.owner.name },
                  {
                    icon: Calendar,
                    label: "Date added",
                    value: dateLabel(doc.createdAt),
                  },
                  {
                    icon: Calendar,
                    label: "Last updated",
                    value: dateLabel(doc.updatedAt),
                  },
                ].map((r) => (
                  <div className="metadata-row" key={r.label}>
                    <r.icon size={17} />
                    <div>
                      <small>{r.label}</small>
                      <strong>{r.value}</strong>
                    </div>
                  </div>
                ))}
              </div>
              {doc.permissions.canEdit && (
                <div className="document-actions">
                  <button
                    className="button secondary"
                    onClick={() => {
                      setFailure("");
                      setModal("edit");
                    }}
                  >
                    <Pencil size={16} />
                    Edit details
                  </button>
                  <button
                    className="button danger-outline"
                    onClick={() => {
                      setFailure("");
                      setModal("delete");
                    }}
                  >
                    <Trash2 size={16} />
                    Delete document
                  </button>
                </div>
              )}
            </aside>
          </div>
          {modal && (
            <Modal
              title={
                modal === "edit" ? "Edit document details" : "Delete document?"
              }
              onClose={() => {
                if (!busy) setModal(null);
              }}
            >
              <ErrorMessage message={failure} />
              {modal === "edit" ? (
                <form onSubmit={edit}>
                  <fieldset disabled={busy}>
                    <label>
                      Title
                      <input
                        name="title"
                        required
                        maxLength={200}
                        defaultValue={doc.title}
                      />
                    </label>
                    <label>
                      Category
                      <select name="categoryId" defaultValue={doc.category.id}>
                        {cats.data?.data.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Description
                      <textarea
                        name="description"
                        maxLength={2000}
                        rows={4}
                        defaultValue={doc.description || ""}
                      />
                    </label>
                  </fieldset>
                  <div className="form-actions">
                    <button
                      type="button"
                      disabled={busy}
                      className="button secondary"
                      onClick={() => setModal(null)}
                    >
                      Cancel
                    </button>
                    <button className="button primary" disabled={busy}>
                      {busy ? "SavingΓÇª" : "Save changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="dialog-description">
                    ΓÇ£{doc.title}ΓÇ¥ and its file will be permanently removed. This
                    action cannot be undone.
                  </p>
                  <div className="form-actions">
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => setModal(null)}
                    >
                      Keep document
                    </button>
                    <button
                      className="button danger"
                      disabled={busy}
                      onClick={remove}
                    >
                      {busy ? "DeletingΓÇª" : "Delete document"}
                    </button>
                  </div>
                </>
              )}
            </Modal>
          )}
        </>
      )}
    </>
  );
}
