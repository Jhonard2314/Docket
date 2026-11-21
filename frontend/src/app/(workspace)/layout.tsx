import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <WorkspaceShell user={user}>{children}</WorkspaceShell>;
}
