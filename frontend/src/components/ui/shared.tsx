"use client";
import { useEffect, useRef } from "react";
import { AlertCircle, FileText, X, FolderOpen } from "lucide-react";
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <div className="error-banner" role="alert">
      <AlertCircle size={18} />
      {message}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      Loading your workspaceΓÇª
    </div>
  );
}
export function Empty({
  title = "No documents yet",
  description = "Upload your first document to get started.",
  children,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <FolderOpen size={36} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";
  return (
    <span className={`file-icon file-${ext.toLowerCase()}`}>
      <FileText size={22} />
      <span>{ext}</span>
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
