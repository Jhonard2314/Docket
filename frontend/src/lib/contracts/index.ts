export type Role = "ADMIN" | "DEPARTMENT_HEAD" | "EMPLOYEE";
export type NamedRef = { id: string; name: string };
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: NamedRef | null;
};
export type AdminUser = CurrentUser & { isActive: boolean; createdAt: string };
export type DocumentStatus = "PENDING" | "APPROVED" | "ARCHIVED" | "DELETING";

export type DocumentDto = {
  id: string;
  title: string;
  description: string | null;
  category: NamedRef;
  department: NamedRef;
  owner: { id: string; name: string };
  file: { name: string; contentType: string; sizeBytes: number };
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  approvedBy?: { id: string; name: string } | null;
  archivedAt?: string | null;
  permissions: { 
    canEdit: boolean; 
    canDelete: boolean; 
    canDownload: boolean;
    canApprove?: boolean;
    canArchive?: boolean;
    canRestore?: boolean;
  };
};
export type DashboardDto = {
  documentCount: number;
  pendingCount?: number; // For dept heads and admins
  storageBytes: number;
  recentDocuments: DocumentDto[];
  departments: (NamedRef & { count: number; pendingCount?: number })[];
  categoryCount: number;
  userStats?: { // For dept heads
    uploads: number;
    lastUpload: string | null;
  };
};
export type ListResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const FILE_ACCEPT = ".pdf,.docx,.xlsx,.txt,.png,.jpg,.jpeg";
export const ROLES: { value: Role; label: string }[] = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "DEPARTMENT_HEAD", label: "Department head" },
  { value: "ADMIN", label: "Administrator" },
];
