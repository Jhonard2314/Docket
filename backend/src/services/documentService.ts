import prisma              from '../config/db';
import { Role, DocumentStatus } from '@prisma/client';
import { deleteS3Object }  from '../utils/deleteS3Object';
import { getPresignedUrl } from '../utils/presignedUrl';
import { getPresignedPost } from '../utils/presignedPost';
import { generateS3Key }   from '../utils/generateS3Key';
import crypto              from 'crypto';

// ── Shared document select ───────────────────────────────────────────────────

const DOC_SELECT = {
  id: true, title: true, description: true, filename: true,
  mimeType: true, sizeBytes: true, status: true,
  createdAt: true, updatedAt: true,
  category:   { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  uploadedBy: { select: { id: true, name: true } },
};

// ── Permission helpers ───────────────────────────────────────────────────────

function canViewDoc(doc: any, userId: string, role: Role, deptId: string | null | undefined): boolean {
  if (role === 'ADMIN') return true;
  if (doc.department.id !== deptId) return false;
  return true; // employees and dept heads see all ready docs in their dept
}

function canMutateDoc(doc: any, userId: string, role: Role, deptId: string | null | undefined): boolean {
  if (role === 'ADMIN') return true;
  if (doc.department.id !== deptId) return false;
  if (role === 'DEPARTMENT_HEAD') return true;
  // EMPLOYEE: only own uploads
  return doc.uploadedBy.id === userId;
}

// ── Upload intent ────────────────────────────────────────────────────────────

export async function createUploadIntent(input: {
  title: string;
  description?: string;
  categoryId: string;
  departmentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
}) {
  const stagingKey = `staging/${input.uploadedById}/${crypto.randomBytes(16).toString('hex')}/${input.filename}`;
  const expiresAt  = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  const doc = await prisma.document.create({
    data: {
      title:       input.title,
      description: input.description,
      filename:    input.filename,
      s3Key:       `final/${input.uploadedById}/${crypto.randomBytes(16).toString('hex')}/${input.filename}`,
      stagingKey,
      mimeType:    input.mimeType,
      sizeBytes:   input.sizeBytes,
      status:      'PENDING',
      categoryId:  input.categoryId,
      departmentId: input.departmentId,
      uploadedById: input.uploadedById,
    },
  });

  const { url, fields } = await getPresignedPost(stagingKey, input.mimeType, input.sizeBytes);

  return {
    uploadId:  doc.id,
    expiresAt: expiresAt.toISOString(),
    upload: { method: 'POST' as const, url, fields },
  };
}

// ── Upload completion ────────────────────────────────────────────────────────

export async function completeUpload(uploadId: string, userId: string, role: Role) {
  const doc = await prisma.document.findUnique({ where: { id: uploadId } });
  if (!doc) throw Object.assign(new Error('Upload not found.'), { code: 'NOT_FOUND' });
  if (role !== 'ADMIN' && doc.uploadedById !== userId) throw Object.assign(new Error('Forbidden.'), { code: 'FORBIDDEN' });

  if (doc.status === 'READY') {
    // Idempotent: already completed
    return prisma.document.findUnique({ where: { id: uploadId }, select: DOC_SELECT });
  }

  if (doc.status !== 'PENDING') throw Object.assign(new Error('Upload is not pending.'), { code: 'CONFLICT' });

  // Mark as READY and clear staging key
  const ready = await prisma.document.update({
    where: { id: uploadId },
    data:  { status: 'READY', stagingKey: null },
    select: DOC_SELECT,
  });

  // Clean up staging object (best-effort)
  if (doc.stagingKey) {
    deleteS3Object(doc.stagingKey).catch(e => console.warn('Staging cleanup failed:', e));
  }

  return ready;
}

// ── Document listing ─────────────────────────────────────────────────────────

export async function getDocuments(opts: {
  userId: string;
  role: Role;
  departmentId: string | null | undefined;
  q?: string;
  categoryId?: string;
  departmentFilter?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  const { userId, role, departmentId, q, categoryId, departmentFilter, sort = 'newest', page = 1, pageSize = 20 } = opts;
  const take = Math.min(pageSize, 100);
  const skip = (page - 1) * take;

  const orderBy = sort === 'oldest'    ? { createdAt: 'asc' as const }
                : sort === 'titleAsc'  ? [{ title: 'asc' as const }, { id: 'asc' as const }]
                : sort === 'titleDesc' ? [{ title: 'desc' as const }, { id: 'asc' as const }]
                : [{ createdAt: 'desc' as const }, { id: 'asc' as const }];

  const where: any = {
    status: 'READY',
    ...(role !== 'ADMIN' && { departmentId: departmentId ?? '__none__' }),
    ...(departmentFilter && role === 'ADMIN' && { departmentId: departmentFilter }),
    ...(categoryId && { categoryId }),
    ...(q && { OR: [{ title: { contains: q, mode: 'insensitive' } }, { filename: { contains: q, mode: 'insensitive' } }] }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.document.findMany({ where, select: DOC_SELECT, orderBy, take, skip }),
    prisma.document.count({ where }),
  ]);

  return { data, pagination: { page, pageSize: take, total, totalPages: Math.ceil(total / take) } };
}

// ── Document detail ──────────────────────────────────────────────────────────

export async function getDocumentById(id: string, userId: string, role: Role, departmentId: string | null | undefined) {
  const doc = await prisma.document.findUnique({ where: { id }, select: { ...DOC_SELECT, uploadedBy: { select: { id: true, name: true } } } });
  if (!doc || doc.status === 'PENDING') throw Object.assign(new Error('Document not found.'), { code: 'NOT_FOUND' });
  if (!canViewDoc(doc, userId, role, departmentId)) throw Object.assign(new Error('Document not found.'), { code: 'NOT_FOUND' });
  return {
    ...doc,
    permissions: {
      canEdit:     canMutateDoc(doc, userId, role, departmentId),
      canDelete:   canMutateDoc(doc, userId, role, departmentId),
      canDownload: true,
    },
  };
}

// ── Metadata update ──────────────────────────────────────────────────────────

export async function updateDocument(id: string, patch: { title?: string; description?: string; categoryId?: string }, userId: string, role: Role, departmentId: string | null | undefined) {
  const doc = await getDocumentById(id, userId, role, departmentId);
  if (!doc.permissions.canEdit) throw Object.assign(new Error('Forbidden.'), { code: 'FORBIDDEN' });
  return prisma.document.update({ where: { id }, data: patch, select: DOC_SELECT });
}

// ── Download ─────────────────────────────────────────────────────────────────

export async function getDownloadUrl(id: string, userId: string, role: Role, departmentId: string | null | undefined) {
  const doc = await getDocumentById(id, userId, role, departmentId);
  const url = await getPresignedUrl(doc.s3Key);
  const expiresAt = new Date(Date.now() + 900 * 1000).toISOString();
  return { url, expiresAt };
}

// ── Deletion ─────────────────────────────────────────────────────────────────

export async function deleteDocument(id: string, userId: string, role: Role, departmentId: string | null | undefined) {
  const doc = await prisma.document.findUnique({ where: { id }, select: { ...DOC_SELECT } });

  if (!doc) return; // Already deleted — 204 is correct per contract.

  if (!canMutateDoc(doc, userId, role, departmentId)) {
    throw Object.assign(new Error('Document not found.'), { code: 'NOT_FOUND' });
  }

  // Mark as DELETING first so it disappears from lists immediately.
  await prisma.document.update({ where: { id }, data: { status: 'DELETING' } });

  try {
    await deleteS3Object(doc.s3Key);
  } catch (e) {
    console.error('S3 deletion failed; row left in DELETING state for retry:', e);
    throw Object.assign(new Error('File deletion failed; please retry.'), { code: 'SERVICE_ERROR' });
  }

  await prisma.document.delete({ where: { id } });
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(userId: string, role: Role, departmentId: string | null | undefined) {
  const deptFilter = role !== 'ADMIN' ? { departmentId: departmentId ?? '__none__' } : {};

  const [documentCount, storageResult, recentDocuments, departments] = await prisma.$transaction([
    prisma.document.count({ where: { status: 'READY', ...deptFilter } }),
    prisma.document.aggregate({ where: { status: 'READY', ...deptFilter }, _sum: { sizeBytes: true } }),
    prisma.document.findMany({ where: { status: 'READY', ...deptFilter }, select: DOC_SELECT, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.department.findMany({
      select: {
        id: true, name: true,
        _count: { select: { documents: { where: { status: 'READY', ...deptFilter } } } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    documentCount,
    storageBytes: storageResult._sum.sizeBytes ?? 0,
    recentDocuments,
    departments: departments.map(d => ({ id: d.id, name: d.name, count: d._count.documents })),
  };
}
