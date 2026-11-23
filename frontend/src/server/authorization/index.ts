import type { CurrentUser, DocumentDto } from "@/lib/contracts";
export function canView(user: CurrentUser, doc: DocumentDto) {
  return user.role === "ADMIN" || user.department?.id === doc.department.id;
}
export function canManage(user: CurrentUser, doc: DocumentDto) {
  return (
    canView(user, doc) && (user.role !== "EMPLOYEE" || doc.owner.id === user.id)
  );
}
export function documentDto(user: CurrentUser, doc: DocumentDto): DocumentDto {
  const manage = canManage(user, doc);
  return {
    ...doc,
    permissions: { canDownload: true, canEdit: manage, canDelete: manage },
  };
}
