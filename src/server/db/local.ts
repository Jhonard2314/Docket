import "server-only";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { AdminUser, DocumentDto, NamedRef } from "@/lib/contracts";

export type StoredUser = AdminUser & { passwordHash: string };
export type Store = {
  users: StoredUser[];
  documents: DocumentDto[];
  departments: NamedRef[];
  categories: NamedRef[];
  sessions: { token: string; userId: string; expires: number }[];
};
export const dataDir = path.join(process.cwd(), ".data");
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  const [salt, key] = hash.split(":");
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(key, "hex"));
}
export function publicUser(user: StoredUser): AdminUser {
  const { passwordHash: _, ...safe } = user;
  void _;
  return safe;
}
async function seed(): Promise<Store> {
  const departments = [
    { id: "dep-hr", name: "Human Resources" },
    { id: "dep-fin", name: "Finance" },
    { id: "dep-ops", name: "Operations" },
    { id: "dep-it", name: "Information Technology" },
  ];
  const categories = [
    { id: "cat-policy", name: "Policies" },
    { id: "cat-report", name: "Reports" },
    { id: "cat-form", name: "Forms" },
    { id: "cat-guide", name: "Guidelines" },
  ];
  const now = new Date().toISOString();
  const users: StoredUser[] = [
    {
      id: "user-admin",
      name: "Alex Morgan",
      email: "admin@docket.local",
      role: "ADMIN",
      department: null,
      isActive: true,
      createdAt: now,
      passwordHash: hashPassword("Docket123!"),
    },
    {
      id: "user-head",
      name: "Jamie Santos",
      email: "head@docket.local",
      role: "DEPARTMENT_HEAD",
      department: departments[0],
      isActive: true,
      createdAt: now,
      passwordHash: hashPassword("Docket123!"),
    },
    {
      id: "user-employee",
      name: "Sam Reyes",
      email: "employee@docket.local",
      role: "EMPLOYEE",
      department: departments[0],
      isActive: true,
      createdAt: now,
      passwordHash: hashPassword("Docket123!"),
    },
  ];
  const titles = [
    "Employee onboarding guide",
    "Quarterly financial overview",
    "Remote work policy",
    "IT security guidelines",
    "Leave request form",
    "Operations handbook",
    "Benefits and wellness overview",
    "Monthly expense template",
  ];
  const documents = await Promise.all(
    titles.map(async (title, i) => {
      const id = `doc-${i + 1}`;
      const text = `${title}\n\nDocket sample document\n\nThis is a demonstration document for exploring the local workspace. Replace it with your team's actual documents.\n`;
      await writeFile(path.join(dataDir, "files", id), text);
      const department = departments[[0, 1, 0, 3, 0, 2, 0, 1][i]];
      return {
        id,
        title,
        description:
          "A shared reference for the team. Keep essential information organized and easy to find.",
        category: categories[[3, 1, 0, 3, 2, 3, 0, 2][i]],
        department,
        owner: {
          id: i % 2 ? "user-admin" : "user-employee",
          name: i % 2 ? "Alex Morgan" : "Sam Reyes",
        },
        file: {
          name: `${title.toLowerCase().replaceAll(" ", "-")}.txt`,
          contentType: "text/plain",
          sizeBytes: Buffer.byteLength(text),
        },
        createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
        updatedAt: now,
        permissions: { canEdit: true, canDelete: true, canDownload: true },
      };
    }),
  );
  return { users, documents, departments, categories, sessions: [] };
}
let queue: Promise<unknown> = Promise.resolve();
export function withStore<T>(
  fn: (db: Store) => Promise<T> | T,
  save = false,
): Promise<T> {
  const task = queue.then(async () => {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.DOCKET_ENABLE_LOCAL_DEMO !== "true"
    )
      throw new Error(
        "Local demo is disabled. Configure the production backend before deployment.",
      );
    await mkdir(path.join(dataDir, "files"), { recursive: true });
    let db: Store;
    try {
      db = JSON.parse(await readFile(path.join(dataDir, "store.json"), "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      db = await seed();
      await writeFile(path.join(dataDir, "store.json"), JSON.stringify(db));
    }
    const result = await fn(db);
    if (save) {
      const temp = path.join(dataDir, "store.tmp");
      await writeFile(temp, JSON.stringify(db));
      await rename(temp, path.join(dataDir, "store.json"));
    }
    return result;
  });
  queue = task.catch(() => {});
  return task;
}
