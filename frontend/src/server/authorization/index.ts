import type { CurrentUser, DocumentDto } from "@/lib/contracts";

export function canView(user: CurrentUser, doc: DocumentDto) {
  // Admins see everything
  if (user.role === "ADMIN") return true;
  
  // Users only see docs in their department
  if (user.department?.id !== doc.department.id) return false;
  
  // Department heads see all docs in their dept (including pending)
  if (user.role === "DEPARTMENT_HEAD") return true;
  
  // Employees only see approved docs OR their own pending uploads
  return doc.status === "APPROVED" || doc.owner.id === user.id;
}

export function canManage(user: CurrentUser, doc: DocumentDto) {
  if (!canView(user, doc)) return false;
  
  // Admins can manage everything
  if (user.role === "ADMIN") return true;
  
  // Department heads can manage all docs in their department
  if (user.role === "DEPARTMENT_HEAD" && user.department?.id === doc.department.id) return true;
  
  // Employees can only manage their own uploads
  return user.role === "EMPLOYEE" && doc.owner.id === user.id;
}

export function canApprove(user: CurrentUser, doc: DocumentDto) {
  // Only department heads and admins can approve
  if (user.role === "EMPLOYEE") return false;
  
  // Admins can approve any pending doc
  if (user.role === "ADMIN") return true;
  
  // Department heads can only approve docs in their department
  return user.role === "DEPARTMENT_HEAD" && user.department?.id === doc.department.id;
}

export function canArchive(user: CurrentUser, doc: DocumentDto) {
  // Same as canApprove - only dept heads and admins
  return canApprove(user, doc);
}

export function canBulkAction(user: CurrentUser) {
  // Only department heads and admins can do bulk actions
  return user.role !== "EMPLOYEE";
}

export function canEditDepartment(user: CurrentUser, departmentId: string) {
  // Admins can edit any department
  if (user.role === "ADMIN") return true;
  
  // Department heads can only edit their own department
  return user.role === "DEPARTMENT_HEAD" && user.department?.id === departmentId;
}

export function documentDto(user: CurrentUser, doc: DocumentDto): DocumentDto {
  const manage = canManage(user, doc);
  const approve = canApprove(user, doc);
  const archive = canArchive(user, doc);
  
  return {
    ...doc,
    permissions: { 
      canDownload: true, 
      canEdit: manage, 
      canDelete: manage,
      canApprove: approve && doc.status === "PENDING",
      canArchive: archive && doc.status === "APPROVED",
      canRestore: archive && doc.status === "ARCHIVED",
    },
  };
}
