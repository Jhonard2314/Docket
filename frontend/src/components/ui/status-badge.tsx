import type { DocumentStatus } from "@/lib/contracts";

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = {
    PENDING: { label: "Pending approval", className: "status-pending" },
    APPROVED: { label: "Approved", className: "status-approved" },
    ARCHIVED: { label: "Archived", className: "status-archived" },
    DELETING: { label: "Deleting", className: "status-deleting" },
  };
  
  const { label, className } = config[status];
  
  return <span className={`status-badge ${className}`}>{label}</span>;
}
