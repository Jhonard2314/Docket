import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/server/db/prisma";
import type { CurrentUser } from "@/lib/contracts";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get("docket-session")?.value;
  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: { token, expires: { gt: new Date() } },
    include: {
      user: {
        include: { department: { select: { id: true, name: true } } },
      },
    },
  });

  const user = session?.user;
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as CurrentUser["role"],
    department: user.department
      ? { id: user.department.id, name: user.department.name }
      : null,
  };
}
