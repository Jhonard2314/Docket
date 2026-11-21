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
export type DocumentDto = {
  id: string;
  title: string;
  description: string | null;
  category: NamedRef;
  department: NamedRef;
  owner: { id: string; name: string };
  file: { name: string; contentType: string; sizeBytes: number };
  createdAt: string;
  updatedAt: string;
  permissions: { canEdit: boolean; canDelete: boolean; canDownload: boolean };
};
export type DashboardDto = {
  documentCount: number;
  storageBytes: number;
  recentDocuments: DocumentDto[];
  departments: (NamedRef & { count: number })[];
  categoryCount: number;
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
