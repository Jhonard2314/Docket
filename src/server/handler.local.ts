import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
  withStore,
  publicUser,
  verifyPassword,
  hashPassword,
  dataDir,
} from "@/server/db/local";
import { canView, canManage, documentDto } from "@/server/authorization";
import { MAX_FILE_SIZE, type Role, type DocumentDto } from "@/lib/contracts";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function fail(status: number, message: string): never {
  throw new ApiError(status, message);
}
function required(value: unknown, label: string, max = 200): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    fail(400, `${label} is required and must be under ${max} characters.`);
  return value.trim();
}
const ok = (data: unknown, status = 200) =>
  NextResponse.json({ data }, { status });
export async function handle(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const parts = url.pathname.replace(/^\/api\//, "").split("/");
    const method = req.method;
    if (!["GET", "HEAD"].includes(method)) {
      const origin = req.headers.get("origin");
      // Next.js can normalize the URL hostname to localhost. The Host header
      // retains the address used by the browser (including its port).
      const requestOrigin = `${url.protocol}//${req.headers.get("host") || url.host}`;
      if (origin && origin !== requestOrigin)
        fail(403, "Cross-origin requests are not allowed.");
    }
    return await withStore(async (db) => {
      const token = req.cookies.get("docket-session")?.value;
      const session = db.sessions.find(
        (s) => s.token === token && s.expires > Date.now(),
      );
      const user = db.users.find((u) => u.id === session?.userId && u.isActive);
      if (parts[0] === "auth") {
        if (parts[1] === "login" && method === "POST") {
          const body = await req.json();
          const email = required(body.email, "Email").toLowerCase();
          const password = required(body.password, "Password", 256);
          const match = db.users.find(
            (u) => u.email.toLowerCase() === email && u.isActive,
          );
          if (!match || !verifyPassword(password, match.passwordHash))
            fail(401, "Email or password is incorrect.");
          const newToken = randomBytes(32).toString("hex");
          db.sessions = db.sessions.filter((s) => s.expires > Date.now());
          db.sessions.push({
            token: newToken,
            userId: match.id,
            expires: Date.now() + 86400000,
          });
          const response = ok(publicUser(match));
          response.cookies.set("docket-session", newToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: url.protocol === "https:",
            path: "/",
            maxAge: 86400,
          });
          return response;
        }
        if (parts[1] === "logout" && method === "POST") {
          db.sessions = db.sessions.filter((s) => s.token !== token);
          const response = ok(null);
          response.cookies.delete("docket-session");
          return response;
        }
        fail(404, "Authentication endpoint not found.");
      }
      if (!user) fail(401, "Please sign in to continue.");
      const visible = db.documents.filter((d) => canView(user, d));
      const list = <T>(items: T[]) => {
        const pageSize = Math.max(
          1,
          Math.min(100, Number(url.searchParams.get("pageSize")) || 20),
        );
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        return NextResponse.json({
          data: items.slice((page - 1) * pageSize, page * pageSize),
          pagination: {
            page,
            pageSize,
            total: items.length,
            totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
          },
        });
      };
      if (parts[0] === "me") return ok(publicUser(user));
      if (parts[0] === "dashboard")
        return ok({
          documentCount: visible.length,
          storageBytes: visible.reduce((n, d) => n + d.file.sizeBytes, 0),
          recentDocuments: [...visible]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 5)
            .map((d) => documentDto(user, d)),
          categoryCount: db.categories.length,
          departments: db.departments
            .filter(
              (d) => user.role === "ADMIN" || d.id === user.department?.id,
            )
            .map((d) => ({
              ...d,
              count: visible.filter((doc) => doc.department.id === d.id).length,
            })),
        });
      if (parts[0] === "documents") {
        if (parts[1] === "uploads" && method === "POST") {
          const form = await req.formData();
          const file = form.get("file");
          if (!(file instanceof File) || !file.size)
            fail(400, "Select a nonempty file.");
          if (file.size > MAX_FILE_SIZE)
            fail(413, "Files must be 10 MB or smaller.");
          const ext = file.name.split(".").pop()?.toLowerCase();
          const types: Record<string, string> = {
            pdf: "application/pdf",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            txt: "text/plain",
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
          };
          if (!ext || !types[ext])
            fail(415, "Use PDF, DOCX, XLSX, TXT, PNG, or JPEG files.");
          const bytes = Buffer.from(await file.arrayBuffer());
          const valid =
            ext === "txt"
              ? !bytes.includes(0)
              : ext === "pdf"
                ? bytes.subarray(0, 5).toString() === "%PDF-"
                : ext === "png"
                  ? bytes
                      .subarray(0, 8)
                      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
                  : ["jpg", "jpeg"].includes(ext)
                    ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
                    : bytes[0] === 80 && bytes[1] === 75;
          if (!valid) fail(415, "The file contents do not match its format.");
          const category = db.categories.find(
            (c) => c.id === form.get("categoryId"),
          );
          const department = db.departments.find(
            (d) =>
              d.id ===
              (user.role === "ADMIN"
                ? form.get("departmentId")
                : user.department?.id),
          );
          if (!category || !department)
            fail(400, "Choose a valid category and department.");
          const now = new Date().toISOString();
          const doc: DocumentDto = {
            id: randomUUID(),
            title: required(form.get("title"), "Title"),
            description: String(form.get("description") || "").slice(0, 2000),
            category,
            department,
            owner: { id: user.id, name: user.name },
            file: {
              name: file.name,
              contentType: types[ext],
              sizeBytes: file.size,
            },
            createdAt: now,
            updatedAt: now,
            permissions: { canDownload: true, canEdit: true, canDelete: true },
          };
          await writeFile(path.join(dataDir, "files", doc.id), bytes);
          db.documents.unshift(doc);
          return ok(documentDto(user, doc), 201);
        }
        if (!parts[1] && method === "GET") {
          const q = (url.searchParams.get("q") || "").toLowerCase();
          const category = url.searchParams.get("categoryId");
          const department = url.searchParams.get("departmentId");
          const sort = url.searchParams.get("sort");
          const docs = visible.filter(
            (d) =>
              (!q || `${d.title} ${d.file.name}`.toLowerCase().includes(q)) &&
              (!category || d.category.id === category) &&
              (!department || d.department.id === department),
          );
          docs.sort(
            (a, b) =>
              (sort === "titleAsc"
                ? a.title.localeCompare(b.title)
                : sort === "titleDesc"
                  ? b.title.localeCompare(a.title)
                  : sort === "oldest"
                    ? a.createdAt.localeCompare(b.createdAt)
                    : b.createdAt.localeCompare(a.createdAt)) ||
              a.id.localeCompare(b.id),
          );
          return list(docs.map((d) => documentDto(user, d)));
        }
        const doc = db.documents.find((d) => d.id === parts[1]);
        if (!doc) {
          if (method === "DELETE")
            return new NextResponse(null, { status: 204 });
          fail(404, "Document not found.");
        }
        if (!canView(user, doc)) fail(404, "Document not found.");
        if (parts[2] === "download" && method === "GET") {
          const bytes = await readFile(path.join(dataDir, "files", doc.id));
          return new NextResponse(bytes, {
            headers: {
              "Content-Type": doc.file.contentType,
              "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.file.name)}`,
              "Cache-Control": "private, no-store",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }
        if (method === "GET") return ok(documentDto(user, doc));
        if (!canManage(user, doc))
          fail(403, "You do not have permission to change this document.");
        if (method === "PATCH") {
          const body = await req.json();
          if (
            Object.keys(body).some(
              (k) => !["title", "description", "categoryId"].includes(k),
            )
          )
            fail(400, "Only title, description, and category can be edited.");
          const category = db.categories.find((c) => c.id === body.categoryId);
          if (!category) fail(400, "Choose a valid category.");
          doc.title = required(body.title, "Title");
          doc.description = String(body.description || "").slice(0, 2000);
          doc.category = category;
          doc.updatedAt = new Date().toISOString();
          return ok(documentDto(user, doc));
        }
        if (method === "DELETE") {
          await unlink(path.join(dataDir, "files", doc.id)).catch((e) => {
            if (e.code !== "ENOENT") throw e;
          });
          db.documents = db.documents.filter((d) => d.id !== doc.id);
          return new NextResponse(null, { status: 204 });
        }
      }
      const collection =
        parts[0] === "categories"
          ? "categories"
          : parts[0] === "admin" && parts[1] === "departments"
            ? "departments"
            : null;
      if (collection) {
        const id = parts[collection === "categories" ? 1 : 2];
        if (method === "GET") {
          let items = db[collection];
          if (collection === "departments" && user.role !== "ADMIN")
            items = items.filter((d) => d.id === user.department?.id);
          return list(
            items.filter((d) =>
              d.name
                .toLowerCase()
                .includes((url.searchParams.get("q") || "").toLowerCase()),
            ),
          );
        }
        if (user.role !== "ADMIN") fail(403, "Administrator access required.");
        if (method === "DELETE") {
          if (
            db.documents.some(
              (d) =>
                (collection === "categories"
                  ? d.category.id
                  : d.department.id) === id,
            ) ||
            (collection === "departments" &&
              db.users.some((u) => u.department?.id === id))
          )
            fail(
              409,
              "This record is in use. Reassign its documents or accounts first.",
            );
          db[collection] = db[collection].filter((x) => x.id !== id);
          return new NextResponse(null, { status: 204 });
        }
        const body = await req.json();
        const name = required(body.name, "Name", 100);
        if (
          db[collection].some(
            (x) => x.id !== id && x.name.toLowerCase() === name.toLowerCase(),
          )
        )
          fail(409, "That name is already in use.");
        if (method === "POST") {
          const item = { id: randomUUID(), name };
          db[collection].push(item);
          return ok(item, 201);
        }
        if (method === "PATCH") {
          const item = db[collection].find((x) => x.id === id);
          if (!item) fail(404, "Record not found.");
          item.name = name;
          db.documents.forEach((d) => {
            const ref = collection === "categories" ? d.category : d.department;
            if (ref.id === id) ref.name = name;
          });
          if (collection === "departments")
            db.users.forEach((u) => {
              if (u.department?.id === id) u.department.name = name;
            });
          return ok(item);
        }
      }
      if (parts[0] === "admin" && parts[1] === "users") {
        if (user.role !== "ADMIN") fail(403, "Administrator access required.");
        if (method === "GET") return list(db.users.map(publicUser));
        const body = await req.json();
        const existing = db.users.find((u) => u.id === parts[2]);
        if (method === "PATCH" && !existing) fail(404, "Account not found.");
        const role = (body.role || existing?.role) as Role;
        if (!["ADMIN", "DEPARTMENT_HEAD", "EMPLOYEE"].includes(role))
          fail(400, "Choose a valid role.");
        const department =
          db.departments.find(
            (d) => d.id === (body.departmentId ?? existing?.department?.id),
          ) || null;
        if (role !== "ADMIN" && !department)
          fail(400, "Employees and heads need a department.");
        if (existing) {
          const active = body.isActive ?? existing.isActive;
          if (
            existing.role === "ADMIN" &&
            (role !== "ADMIN" || !active) &&
            db.users.filter((u) => u.role === "ADMIN" && u.isActive).length ===
              1
          )
            fail(409, "Keep at least one active administrator.");
          existing.name = required(body.name ?? existing.name, "Name");
          existing.role = role;
          existing.department = role === "ADMIN" ? null : department;
          existing.isActive = !!active;
          return ok(publicUser(existing));
        }
        const email = required(body.email, "Email").toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          fail(400, "Enter a valid email address.");
        if (db.users.some((u) => u.email === email))
          fail(409, "That email is already registered.");
        const password = required(body.password, "Password", 256);
        if (password.length < 8)
          fail(400, "Use a password with at least 8 characters.");
        const account = {
          id: randomUUID(),
          name: required(body.name, "Name"),
          email,
          role,
          department: role === "ADMIN" ? null : department,
          isActive: true,
          createdAt: new Date().toISOString(),
          passwordHash: hashPassword(password),
        };
        db.users.push(account);
        return ok(publicUser(account), 201);
      }
      fail(404, "Endpoint not found.");
    }, !["GET", "HEAD"].includes(method));
  } catch (error) {
    const known = error instanceof ApiError;
    if (!known) console.error(error);
    return NextResponse.json(
      {
        error: {
          code: known ? `HTTP_${error.status}` : "SERVICE_ERROR",
          message: known
            ? error.message
            : "The local service is unavailable. Please try again.",
        },
      },
      { status: known ? error.status : 503 },
    );
  }
}

