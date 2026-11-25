"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  ArrowLeft,
  FileCheck2,
  X,
  LockKeyhole,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { useUser } from "@/components/layout/workspace-shell";
import {
  MAX_FILE_SIZE,
  FILE_ACCEPT,
  type NamedRef,
  type ListResponse,
  type DocumentDto,
} from "@/lib/contracts";
import { ErrorMessage } from "@/components/ui/shared";
import { fileSize } from "@/lib/utils";
export default function UploadForm() {
  const user = useUser();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState(user.department?.id || "");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const cats = useResource<ListResponse<NamedRef>>("/categories?pageSize=100");
  const deps = useResource<ListResponse<NamedRef>>(
    "/admin/departments?pageSize=100",
  );
  function choose(f?: File) {
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      setError("Files must be 10 MB or smaller.");
      return;
    }
    if (
      !FILE_ACCEPT.split(",").some((ext) => f.name.toLowerCase().endsWith(ext))
    ) {
      setError("This file format is not supported.");
      return;
    }
    setFile(f);
    setError("");
    if (!title)
      setTitle(
        f.name
          .replace(/\.[^.]+$/, " ")
          .trim()
          .replaceAll("-", " "),
      );
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    form.set("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/documents/uploads");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => {
      setError("Upload failed. Check your connection and try again.");
      setBusy(false);
    };
    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status === 401) {
          window.location.assign("/login");
          return;
        }
        if (xhr.status !== 201)
          throw new Error(result.error?.message || "Upload failed.");
        router.push(`/documents/${(result.data as DocumentDto).id}?uploaded=1`);
      } catch (err) {
        setError((err as Error).message);
        setBusy(false);
      }
    };
    xhr.send(form);
  }
  return (
    <>
      <Link href="/documents" className="back-link">
        <ArrowLeft size={16} />
        Back to documents
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE ROOM FOR GOOD WORK</div>
          <h1>
            Upload a document<span className="greeting-dot">.</span>
          </h1>
          <p>A new addition to your team’s shared knowledge.</p>
        </div>
      </div>
      <div className="upload-layout">
        <form className="panel form-panel" onSubmit={submit}>
          <h2>Document details</h2>
          <p className="muted">
            Choose your file, then give it a little context.
          </p>
          <ErrorMessage message={error || cats.error || deps.error} />
          <div
            className={`drop-zone ${drag ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (!busy) choose(e.dataTransfer.files[0]);
            }}
          >
            <input
              ref={input}
              className="sr-only"
              type="file"
              accept={FILE_ACCEPT}
              aria-label="Choose document file"
              disabled={busy}
              onChange={(e) => choose(e.target.files?.[0])}
            />
            {file ? (
              <>
                <FileCheck2 size={32} />
                <strong>{file.name}</strong>
                <p>{fileSize(file.size)} · Ready to upload</p>
                <button
                  type="button"
                  className="button secondary small"
                  disabled={busy}
                  onClick={() => {
                    setFile(null);
                    if (input.current) input.current.value = "";
                  }}
                >
                  <X size={14} />
                  Remove file
                </button>
              </>
            ) : (
              <>
                <span className="upload-circle">
                  <UploadCloud size={27} />
                </span>
                <strong>Drop your document here</strong>
                <p>
                  or{" "}
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => input.current?.click()}
                  >
                    browse files
                  </button>{" "}
                  on your computer
                </p>
                <small>PDF, DOCX, XLSX, TXT, PNG, JPG · Up to 10 MB</small>
              </>
            )}
          </div>
          <fieldset disabled={busy}>
            <label>
              Document title <span>*</span>
              <input
                name="title"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Employee onboarding guide"
              />
            </label>
            <div className="form-grid">
              <label>
                Category <span>*</span>
                <select name="categoryId" required defaultValue="">
                  <option value="" disabled>
                    Select a category
                  </option>
                  {cats.data?.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {user.role === "ADMIN" ? (
                <label>
                  Department <span>*</span>
                  <select
                    name="departmentId"
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a department
                    </option>
                    {deps.data?.data.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  Department
                  <input
                    type="text"
                    value={user.department?.name || "No department"}
                    disabled
                    style={{ background: '#f7f8f4', cursor: 'not-allowed' }}
                  />
                  <input
                    type="hidden"
                    name="departmentId"
                    value={user.department?.id || ""}
                  />
                  <small className="muted">
                    Your assigned department
                  </small>
                </label>
              )}
            </div>
            <label>
              Description <span className="optional">optional</span>
              <textarea
                name="description"
                maxLength={2000}
                rows={4}
                placeholder="What should your team know about this document?"
              />
            </label>
          </fieldset>
          {busy && (
            <div className="upload-progress" role="status">
              <div>
                <span style={{ width: `${progress}%` }} />
              </div>
              <p>
                {progress < 100
                  ? `Uploading… ${progress}%`
                  : "Saving your document…"}
              </p>
            </div>
          )}
          <div className="form-actions">
            <Link href="/documents" className="button secondary">
              Cancel
            </Link>
            <button
              className="button primary"
              disabled={busy || !file || !cats.data || !deps.data}
            >
              <UploadCloud size={17} />
              {busy ? "Uploading…" : "Upload document"}
            </button>
          </div>
        </form>
        <aside className="upload-aside">
          <span className="advice-icon">
            <LockKeyhole size={24} />
          </span>
          <h3>Shared with the right people.</h3>
          <p>
            Your document will be available to your department and workspace
            administrators.
          </p>
          <hr />
          <h4>A few helpful tips</h4>
          <ul>
            <li>Use a clear, descriptive title.</li>
            <li>Pick a category that makes it easy to find.</li>
            <li>Add context for your teammates.</li>
          </ul>
          <div className="preview-note">
            Local preview
            <br />
            <small>
              Files are saved on this computer. AWS storage will be connected in
              the next phase.
            </small>
          </div>
        </aside>
      </div>
    </>
  );
}
