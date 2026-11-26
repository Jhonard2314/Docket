import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { prisma } from "@/server/db/prisma";
import { canView, canManage, canApprove, canArchive, canBulkAction } from "@/server/authorization";
import type { CurrentUser, DocumentDto, Role } from "@/lib/contracts";
import { MAX_FILE_SIZE } from "@/lib/contracts";
import { hashPassword, verifyPassword } from "@/server/db/crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "ap-southeast-1" });
const BUCKET = process.env.S3_BUCKET_NAME!;

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function fail(status: number, message: string): never { throw new ApiError(status, message); }
function required(v: unknown, label: string, max = 200): string {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    fail(400, `${label} is required and must be under ${max} characters.`);
  return (v as string).trim();
}
const ok = (data: unknown, status = 200) => NextResponse.json({ data }, { status });

function toDto(user: CurrentUser, doc: any): DocumentDto {
  const d: DocumentDto = {
    id: doc.id,
    title: doc.title,
    description: doc.description ?? "",
    category: { id: doc.category.id, name: doc.category.name },
    department: { id: doc.department.id, name: doc.department.name },
    owner: { id: doc.uploadedBy.id, name: doc.uploadedBy.name },
    file: { name: doc.filename, contentType: doc.mimeType, sizeBytes: doc.sizeBytes },
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    approvedAt: doc.approvedAt?.toISOString() ?? null,
    approvedBy: doc.approvedBy ? { id: doc.approvedBy.id, name: doc.approvedBy.name } : null,
    archivedAt: doc.archivedAt?.toISOString() ?? null,
    permissions: { canDownload: true, canEdit: false, canDelete: false },
  };
  const manage = canManage(user, d);
  d.permissions = { canDownload: true, canEdit: manage, canDelete: manage };
  return d;
}

function publicUser(u: any): CurrentUser {
  return {
    id: u.id, name: u.name, email: u.email,
    role: u.role as Role,
    department: u.department ? { id: u.department.id, name: u.department.name } : null,
  };
}

const DOC_INCLUDE = {
  category:   { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  uploadedBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
};

export async function handle(req: NextRequest): Promise<NextResponse> {
  try {
    const url   = req.nextUrl;
    const parts = url.pathname.replace(/^\/api\//, "").split("/");
    const method = req.method;

    // ── Auth ────────────────────────────────────────────────────────────────
    if (parts[0] === "auth") {
      if (parts[1] === "login" && method === "POST") {
        const body  = await req.json();
        const email = required(body.email, "Email").toLowerCase();
        const pass  = required(body.password, "Password", 256);
        const match = await prisma.user.findFirst({
          where: { email, isActive: true },
          include: { department: { select: { id: true, name: true } } },
        });
        if (!match || !verifyPassword(pass, match.passwordHash))
          fail(401, "Email or password is incorrect.");
        const token = randomUUID();
        await prisma.session.create({
          data: { token, userId: match.id, expires: new Date(Date.now() + 86400000) },
        });
        const res = ok(publicUser(match));
        res.cookies.set("docket-session", token, {
          httpOnly: true, sameSite: "lax",
          secure: url.protocol === "https:", path: "/", maxAge: 86400,
        });
        return res;
      }
      if (parts[1] === "logout" && method === "POST") {
        const token = req.cookies.get("docket-session")?.value;
        if (token) await prisma.session.deleteMany({ where: { token } });
        const res = ok(null);
        res.cookies.delete("docket-session");
        return res;
      }
      fail(404, "Auth endpoint not found.");
    }

    // ── Require session ──────────────────────────────────────────────────────
    const token   = req.cookies.get("docket-session")?.value;
    const session = token ? await prisma.session.findFirst({
      where: { token, expires: { gt: new Date() } },
      include: { user: { include: { department: { select: { id: true, name: true } } } } },
    }) : null;
    const user = session?.user?.isActive ? session.user : null;
    if (!user) fail(401, "Please sign in to continue.");
    const cu = publicUser(user);

    // ── Pagination helper ────────────────────────────────────────────────────
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("pageSize")) || 20));
    const page     = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const list = (items: unknown[], total: number) => NextResponse.json({
      data: items,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });

    // ── /api/me ──────────────────────────────────────────────────────────────
    if (parts[0] === "me") return ok(cu);

    // ── /api/dashboard ───────────────────────────────────────────────────────
    if (parts[0] === "dashboard") {
      const deptFilter = cu.role !== "ADMIN" ? { departmentId: cu.department?.id ?? "__none__" } : {};
      
      // Build status filter based on role
      const statusFilter = cu.role === "EMPLOYEE" 
        ? { status: { in: ["APPROVED", "PENDING"] as const }, OR: [{ status: "APPROVED" }, { uploadedById: user.id }] }
        : { status: { in: ["APPROVED", "PENDING"] as const } };
      
      const [documentCount, agg, recentDocs, departments, categoryCount] = await prisma.$transaction([
        prisma.document.count({ where: { status: "APPROVED", ...deptFilter } }),
        prisma.document.aggregate({ where: { status: "APPROVED", ...deptFilter }, _sum: { sizeBytes: true } }),
        prisma.document.findMany({ 
          where: { status: { in: ["APPROVED", "PENDING"] as const }, ...deptFilter }, 
          include: { ...DOC_INCLUDE, approvedBy: { select: { id: true, name: true } } }, 
          orderBy: { createdAt: "desc" }, 
          take: 5 
        }),
        prisma.department.findMany({ 
          include: { 
            _count: { 
              select: { 
                documents: { where: { status: "APPROVED", ...deptFilter } } 
              } 
            } 
          } 
        }),
        prisma.category.count(),
      ]);
      
      // Get pending count separately for non-employees
      const pendingCount = cu.role !== "EMPLOYEE" 
        ? await prisma.document.count({ where: { status: "PENDING", ...deptFilter } })
        : undefined;
      
      return ok({
        documentCount,
        ...(cu.role !== "EMPLOYEE" && { pendingCount }),
        storageBytes: agg._sum.sizeBytes ?? 0,
        recentDocuments: recentDocs.map((d: any) => toDto(cu, d)),
        categoryCount,
        departments: departments
          .filter((d: any) => cu.role === "ADMIN" || d.id === cu.department?.id)
          .map((d: any) => ({ id: d.id, name: d.name, count: d._count.documents })),
      });
    }

    // ── /api/documents ───────────────────────────────────────────────────────
    if (parts[0] === "documents") {
      // Upload
      if (parts[1] === "uploads" && method === "POST") {
        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof File) || !file.size) fail(400, "Select a file.");
        if (file.size > MAX_FILE_SIZE) fail(413, "Files must be 10 MB or smaller.");

        const ext = file.name.split(".").pop()?.toLowerCase();
        const mimeMap: Record<string, string> = {
          pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          txt: "text/plain", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
        };
        if (!ext || !mimeMap[ext]) fail(415, "Use PDF, DOCX, XLSX, TXT, PNG, or JPEG.");

        const bytes = Buffer.from(await file.arrayBuffer());
        const valid = ext === "txt" ? !bytes.includes(0)
          : ext === "pdf" ? bytes.subarray(0,5).toString() === "%PDF-"
          : ext === "png" ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
          : ["jpg","jpeg"].includes(ext) ? bytes[0]===255 && bytes[1]===216 && bytes[2]===255
          : bytes[0]===80 && bytes[1]===75;
        if (!valid) fail(415, "File contents do not match its format.");

        const category   = await prisma.category.findUnique({ where: { id: String(form.get("categoryId")) } });
        const deptId     = cu.role === "ADMIN" ? String(form.get("departmentId")) : cu.department?.id;
        const department = await prisma.department.findUnique({ where: { id: deptId ?? "" } });
        if (!category || !department) fail(400, "Choose a valid category and department.");

        const s3Key = `uploads/${user.id}/${randomUUID()}.${ext}`;
        await s3.send(new (await import("@aws-sdk/client-s3")).PutObjectCommand({
          Bucket: BUCKET, Key: s3Key, Body: bytes, ContentType: mimeMap[ext],
        }));

        const doc = await prisma.document.create({
          data: {
            title: required(form.get("title"), "Title"),
            description: String(form.get("description") || ""),
            filename: file.name, s3Key, mimeType: mimeMap[ext], sizeBytes: file.size,
            status: cu.role === "EMPLOYEE" ? "PENDING" : "APPROVED",
            ...(cu.role !== "EMPLOYEE" && { approvedById: user.id, approvedAt: new Date() }),
            categoryId: category.id, departmentId: department.id, uploadedById: user.id,
          },
          include: { ...DOC_INCLUDE, approvedBy: { select: { id: true, name: true } } },
        });
        return ok(toDto(cu, doc), 201);
      }

      // Bulk actions (POST /api/documents/bulk)
      if (parts[1] === "bulk" && method === "POST") {
        if (!canBulkAction(cu)) fail(403, "Bulk actions are only available to department heads and administrators.");
        const body = await req.json();
        const action = body.action; // "approve", "archive", "delete"
        const ids = Array.isArray(body.ids) ? body.ids : [];
        if (!ids.length || ids.length > 100) fail(400, "Provide 1-100 document IDs.");
        
        const deptFilter = cu.role !== "ADMIN" ? { departmentId: cu.department?.id ?? "__none__" } : {};
        const docs = await prisma.document.findMany({ 
          where: { id: { in: ids }, ...deptFilter },
          include: DOC_INCLUDE,
        });
        
        if (docs.length !== ids.length) fail(400, "Some documents were not found or you don't have access.");
        
        if (action === "approve") {
          await prisma.document.updateMany({
            where: { id: { in: ids }, status: "PENDING" },
            data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() },
          });
          return ok({ updated: docs.length });
        } else if (action === "archive") {
          await prisma.document.updateMany({
            where: { id: { in: ids }, status: "APPROVED" },
            data: { status: "ARCHIVED", archivedAt: new Date() },
          });
          return ok({ updated: docs.length });
        } else if (action === "delete") {
          for (const doc of docs) {
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: doc.s3Key })).catch(e => { if (e.name !== "NoSuchKey") throw e; });
          }
          await prisma.document.deleteMany({ where: { id: { in: ids } } });
          return ok({ deleted: docs.length });
        }
        
        fail(400, "Invalid action. Use 'approve', 'archive', or 'delete'.");
      }

      // List
      if (!parts[1] && method === "GET") {
        const q    = (url.searchParams.get("q") || "").toLowerCase();
        const catId = url.searchParams.get("categoryId");
        const deptId = url.searchParams.get("departmentId");
        const statusParam = url.searchParams.get("status"); // "pending", "approved", "archived"
        const sort  = url.searchParams.get("sort") || "newest";
        const deptFilter = cu.role !== "ADMIN" ? { departmentId: cu.department?.id ?? "__none__" } : {};
        const orderBy = sort === "oldest" ? { createdAt: "asc" as const }
          : sort === "titleAsc"  ? { title: "asc" as const }
          : sort === "titleDesc" ? { title: "desc" as const }
          : { createdAt: "desc" as const };
        
        // Status filter
        let statusFilter: any = {};
        if (statusParam === "pending") {
          statusFilter = { status: "PENDING" };
        } else if (statusParam === "archived") {
          statusFilter = { status: "ARCHIVED" };
        } else {
          // Default: show approved docs, plus user's own pending uploads
          if (cu.role === "EMPLOYEE") {
            statusFilter = { OR: [{ status: "APPROVED" }, { status: "PENDING", uploadedById: user.id }] };
          } else {
            statusFilter = { status: { in: ["APPROVED", "PENDING"] as const } };
          }
        }
        
        // Department filter logic:
        // - If user selects a department in dropdown (deptId exists), use that
        // - Otherwise, for non-Admins, default to their own department
        // - For Admins with no selection, show all departments
        let departmentFilter: any = {};
        if (deptId) {
          // User explicitly selected a department filter
          if (cu.role === "ADMIN") {
            departmentFilter = { departmentId: deptId };
          } else {
            // Non-admin can only filter within their own department
            departmentFilter = { departmentId: cu.department?.id ?? "__none__" };
          }
        } else {
          // No department filter selected
          if (cu.role !== "ADMIN") {
            // Non-admin: default to their own department
            departmentFilter = { departmentId: cu.department?.id ?? "__none__" };
          }
          // Admin with no filter: show all departments (empty filter)
        }
        
        const where: any = {
          ...statusFilter, 
          ...departmentFilter,
          ...(catId && { categoryId: catId }),
          ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { filename: { contains: q, mode: "insensitive" } }] }),
        };
        const [docs, total] = await prisma.$transaction([
          prisma.document.findMany({ 
            where, 
            include: { ...DOC_INCLUDE, approvedBy: { select: { id: true, name: true } } }, 
            orderBy, 
            take: pageSize, 
            skip: (page-1)*pageSize 
          }),
          prisma.document.count({ where }),
        ]);
        return list(docs.map((d: any) => toDto(cu, d)), total);
      }

      // Individual document routes (must have parts[1] as ID)
      if (!parts[1] || parts[1] === "uploads" || parts[1] === "bulk") {
        fail(404, "Endpoint not found.");
      }

      const doc = await prisma.document.findUnique({ where: { id: parts[1] }, include: { ...DOC_INCLUDE, approvedBy: { select: { id: true, name: true } } } });
      const dto = doc ? toDto(cu, doc) : null;
      if (!doc || !canView(cu, dto!)) {
        if (method === "DELETE") return new NextResponse(null, { status: 204 });
        fail(404, "Document not found.");
      }

      // Download — presigned URL
      if (parts[2] === "download" && method === "GET") {
        const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: doc.s3Key }), { expiresIn: 900 });
        return NextResponse.redirect(url);
      }

      if (method === "GET") return ok(dto);

      // Approve document (POST /api/documents/:id/approve)
      if (parts[2] === "approve" && method === "POST") {
        if (!canApprove(cu, dto!)) fail(403, "You do not have permission to approve this document.");
        if (doc.status !== "PENDING") fail(400, "Only pending documents can be approved.");
        const updated = await prisma.document.update({
          where: { id: doc.id },
          data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() },
          include: { ...DOC_INCLUDE, approvedBy: { select: { id: true, name: true } } },
        });
        return ok(toDto(cu, updated));
      }

      // Archive document (POST /api/documents/:id/archive)
      if (parts[2] === "archive" && method === "POST") {
        if (!canArchive(cu, dto!)) fail(403, "You do not have permission to archive this document.");
        if (doc.status !== "APPROVED") fail(400, "Only approved documents can be archived.");
        const updated = await prisma.document.update({
          where: { id: doc.id },
          data: { status: "ARCHIVED", archivedAt: new Date() },
          include: { ...DOC_INCLUDE, approvedBy: { select: { id: true, name: true } } },
        });
        return ok(toDto(cu, updated));
      }

      // Restore document (POST /api/documents/:id/restore)
      if (parts[2] === "restore" && method === "POST") {
        if (!canArchive(cu, dto!)) fail(403, "You do not have permission to restore this document.");
        if (doc.status !== "ARCHIVED") fail(400, "Only archived documents can be restored.");
        const updated = await prisma.document.update({
          where: { id: doc.id },
          data: { status: "APPROVED", archivedAt: null },
          include: { ...DOC_INCLUDE, approvedBy: { select: { id: true, name: true } } },
        });
        return ok(toDto(cu, updated));
      }

      if (!canManage(cu, dto!)) fail(403, "You do not have permission to change this document.");

      if (method === "PATCH") {
        const body = await req.json();
        const allowed = ["title", "description", "categoryId"];
        if (Object.keys(body).some(k => !allowed.includes(k))) fail(400, "Only title, description, and category can be edited.");
        const category = body.categoryId ? await prisma.category.findUnique({ where: { id: body.categoryId } }) : doc.category;
        if (!category) fail(400, "Choose a valid category.");
        const updated = await prisma.document.update({
          where: { id: doc.id },
          data: { title: required(body.title ?? doc.title, "Title"), description: String(body.description ?? doc.description ?? ""), categoryId: category.id },
          include: DOC_INCLUDE,
        });
        return ok(toDto(cu, updated));
      }

      if (method === "DELETE") {
        await prisma.document.update({ where: { id: doc.id }, data: { status: "DELETING" } });
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: doc.s3Key })).catch(e => { if (e.name !== "NoSuchKey") throw e; });
        await prisma.document.delete({ where: { id: doc.id } });
        return new NextResponse(null, { status: 204 });
      }
    }

    // ── /api/categories ───────────────────────────────────────────────────────
    const collection = parts[0] === "categories" ? "category"
      : parts[0] === "admin" && parts[1] === "departments" ? "department"
      : null;

    if (collection) {
      const id  = parts[collection === "category" ? 1 : 2];
      const q   = url.searchParams.get("q") || "";
      if (method === "GET") {
        const items = await (prisma[collection] as any).findMany({
          where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: pageSize, skip: (page-1)*pageSize,
        });
        const total = await (prisma[collection] as any).count({ where: q ? { name: { contains: q, mode: "insensitive" } } : undefined });
        return list(items, total);
      }
      if (cu.role !== "ADMIN") fail(403, "Administrator access required.");
      const body = await req.json();
      const name = required(body.name, "Name", 100);
      if (method === "POST") {
        const item = await (prisma[collection] as any).create({ data: { name }, select: { id: true, name: true } });
        return ok(item, 201);
      }
      if (method === "PATCH") {
        const item = await (prisma[collection] as any).update({ where: { id }, data: { name }, select: { id: true, name: true } });
        return ok(item);
      }
      if (method === "DELETE") {
        await (prisma[collection] as any).delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
      }
    }

    // ── /api/admin/users ──────────────────────────────────────────────────────
    if (parts[0] === "admin" && parts[1] === "users") {
      if (cu.role !== "ADMIN") fail(403, "Administrator access required.");
      if (method === "GET") {
        const items = await prisma.user.findMany({
          include: { department: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: pageSize, skip: (page-1)*pageSize,
        });
        const total = await prisma.user.count();
        return list(items.map((u: any) => ({ ...publicUser(u), isActive: u.isActive, createdAt: u.createdAt.toISOString() })), total);
      }
      const body = await req.json();
      if (method === "POST") {
        const email = required(body.email, "Email").toLowerCase();
        const pass  = required(body.password, "Password", 256);
        if (pass.length < 8) fail(400, "Password must be at least 8 characters.");
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) fail(409, "Email already registered.");
        const user = await prisma.user.create({
          data: { name: required(body.name, "Name"), email, passwordHash: hashPassword(pass), role: body.role || "EMPLOYEE", departmentId: body.departmentId || null },
          include: { department: { select: { id: true, name: true } } },
        });
        return ok({ ...publicUser(user), isActive: user.isActive, createdAt: user.createdAt.toISOString() }, 201);
      }
      const existing = await prisma.user.findUnique({ where: { id: parts[2] }, include: { department: { select: { id: true, name: true } } } });
      if (!existing) fail(404, "User not found.");
      
      // Change password endpoint
      if (parts[3] === "password" && method === "PATCH") {
        const newPassword = required(body.password, "Password", 256);
        if (newPassword.length < 8) fail(400, "Password must be at least 8 characters.");
        
        await prisma.user.update({
          where: { id: parts[2] },
          data: { passwordHash: hashPassword(newPassword) },
        });
        
        return ok({ message: "Password updated successfully" });
      }
      
      if (method === "PATCH") {
        const updated = await prisma.user.update({
          where: { id: parts[2] },
          data: { name: body.name ?? existing.name, role: body.role ?? existing.role, departmentId: body.departmentId ?? existing.departmentId, isActive: body.isActive ?? existing.isActive },
          include: { department: { select: { id: true, name: true } } },
        });
        return ok({ ...publicUser(updated), isActive: updated.isActive, createdAt: updated.createdAt.toISOString() });
      }
      if (method === "DELETE") {
        // Prevent deleting the system administrator
        if (existing.email === "admin@docket.local") {
          fail(403, "The system administrator account cannot be deleted.");
        }
        await prisma.user.delete({ where: { id: parts[2] } });
        return new NextResponse(null, { status: 204 });
      }
    }

    fail(404, "Endpoint not found.");
  } catch (error) {
    const known = error instanceof ApiError;
    if (!known) console.error(error);
    return NextResponse.json(
      { error: { code: known ? `HTTP_${(error as ApiError).status}` : "SERVICE_ERROR", message: known ? (error as ApiError).message : "Service unavailable." } },
      { status: known ? (error as ApiError).status : 503 },
    );
  }
}
