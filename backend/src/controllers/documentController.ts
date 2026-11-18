import { Request, Response } from 'express';
import * as svc from '../services/documentService';

export async function uploadDocument(req: Request, res: Response) {
  try {
    const file = req.file as any;
    if (!file) { res.status(400).json({ success: false, message: 'No file uploaded.' }); return; }
    const { categoryId } = req.body;
    if (!categoryId) { res.status(400).json({ success: false, message: 'categoryId is required.' }); return; }

    const doc = await svc.createDocument({
      filename:     file.originalname,
      s3Key:        file.key,
      mimeType:     file.mimetype,
      sizeBytes:    file.size,
      categoryId,
      uploadedById: res.locals.user.id,
    });
    res.status(201).json({ success: true, document: doc });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function listDocuments(req: Request, res: Response) {
  try {
    const { search, categoryId } = req.query as Record<string, string>;
    const docs = await svc.getDocuments({
      role:       res.locals.user.role,
      userId:     res.locals.user.id,
      search:     search     || undefined,
      categoryId: categoryId || undefined,
    });
    res.json({ success: true, documents: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function renameDoc(req: Request, res: Response) {
  try {
    const { filename } = req.body;
    if (!filename) { res.status(400).json({ success: false, message: 'filename is required.' }); return; }
    const doc = await svc.renameDocument(req.params.id, filename.trim(), res.locals.user.id, res.locals.user.role);
    res.json({ success: true, document: doc });
  } catch (err: any) {
    const status = err.message === 'Access denied.' ? 403 : 404;
    res.status(status).json({ success: false, message: err.message });
  }
}

export async function deleteDoc(req: Request, res: Response) {
  try {
    await svc.deleteDocument(req.params.id, res.locals.user.id, res.locals.user.role);
    res.json({ success: true, message: 'Document deleted.' });
  } catch (err: any) {
    const status = err.message === 'Access denied.' ? 403 : 404;
    res.status(status).json({ success: false, message: err.message });
  }
}

export async function downloadDoc(req: Request, res: Response) {
  try {
    const result = await svc.getDownloadUrl(req.params.id, res.locals.user.id, res.locals.user.role);
    res.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.message === 'Access denied.' ? 403 : 404;
    res.status(status).json({ success: false, message: err.message });
  }
}
