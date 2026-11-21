import "server-only";
import { cookies } from "next/headers";
import { publicUser, withStore } from "@/server/db/local";
export async function getCurrentUser() {
  const token = (await cookies()).get("docket-session")?.value;
  if (!token) return null;
  return withStore((db) => {
    const session = db.sessions.find(
      (s) => s.token === token && s.expires > Date.now(),
    );
    const user = db.users.find((u) => u.id === session?.userId && u.isActive);
    return user ? publicUser(user) : null;
  });
}
