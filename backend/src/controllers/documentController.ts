import { Request, Response } from 'express';

type Role = 'EMPLOYEE' | 'DEPARTMENT_HEAD' | 'ADMIN';
import * as svc from '../services/documentService';
import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES } from '../middleware/uploadMiddleware';

function caller(res: Response) {
  return {
    userId:   res.locals.user.id as string,
    role:     res.locals.user.role as Role,
    deptId:   res.locals.user.departmentId as string | null,
  };
}

function errStatus(code: string): number {
  return { NOT_FOUND: 404, FORBIDDEN: 403, CONFLICT: 409, SERVICE_ERROR: 503 }[code] ?? 500;
}

/** POST /api/documents/uploads — create upload intent, return presigned POST */
export async function createUploadIntent(req: Request, res: Response) {
  try {
    const { title, description, categoryId, departmentId, fileName, contentType, sizeBytes } = req.body;
    const { userId, role, deptId } = caller(res);

    if (!title || !categoryId || !fileName || !contentType || !sizeBytes) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'title, categoryId, fileName, contentType, and sizeBytes are required.' } });
      return;
    }
    if (!ALLOWED_MIME_TYPES[contentType]) {
      res.status(415).json({ error: { code: 'UNSUPPORTED_TYPE', message: 'File type not supported.' } });
      return;
    }
    if (Number(sizeBytes) > MAX_FILE_BYTES) {
      res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds the 10 MiB limit.' } });
      return;
    }

    // Non-admins upload to their own department only.
    const targetDeptId = role === 'ADMIN' ? (departmentId ?? deptId) : deptId;
    if (!targetDeptId) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'User has no department assigned.' } });
      return;
    }

    const result = await svc.createUploadIntent({
      title, description, categoryId,
      departmentId: targetDeptId,
      filename: fileName, mimeType: contentType, sizeBytes: Number(sizeBytes),
      uploadedById: userId,
    });

    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}

/** POST /api/documents/uploads/:id/complete */
export async function completeUpload(req: Request, res: Response) {
  try {
    const { userId, role } = caller(res);
    const doc = await svc.completeUpload(req.params.id, userId, role);
    res.json({ data: doc });
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}

/** GET /api/documents */
export async function listDocuments(req: Request, res: Response) {
  try {
    const { userId, role, deptId } = caller(res);
    const { q, categoryId, departmentId, sort, page, pageSize } = req.query as Record<string, string>;
    const result = await svc.getDocuments({
      userId, role, departmentId: deptId,
      q: q || undefined, categoryId: categoryId || undefined,
      departmentFilter: departmentId || undefined,
      sort, page: Number(page) || 1, pageSize: Number(pageSize) || 20,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'ERROR', message: err.message } });
  }
}

/** GET /api/documents/:id */
export async function getDocument(req: Request, res: Response) {
  try {
    const { userId, role, deptId } = caller(res);
    const doc = await svc.getDocumentById(req.params.id, userId, role, deptId);
    res.json({ data: doc });
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}

/** PATCH /api/documents/:id */
export async function updateDocument(req: Request, res: Response) {
  try {
    const { userId, role, deptId } = caller(res);
    const { title, description, categoryId } = req.body;
    const doc = await svc.updateDocument(req.params.id, { title, description, categoryId }, userId, role, deptId);
    res.json({ data: doc });
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}

/** DELETE /api/documents/:id */
export async function deleteDocument(req: Request, res: Response) {
  try {
    const { userId, role, deptId } = caller(res);
    await svc.deleteDocument(req.params.id, userId, role, deptId);
    res.status(204).send();
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}

/** GET /api/documents/:id/download */
export async function downloadDocument(req: Request, res: Response) {
  try {
    const { userId, role, deptId } = caller(res);
    const result = await svc.getDownloadUrl(req.params.id, userId, role, deptId);
    res.json({ data: result });
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}
