import { Router } from 'express';
import {
  createUploadIntent, completeUpload,
  listDocuments, getDocument, updateDocument,
  deleteDocument, downloadDocument,
} from '../controllers/documentController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// Upload flow — presigned POST (no file streams through Express)
router.post('/uploads',             requireAuth, createUploadIntent);
router.post('/uploads/:id/complete', requireAuth, completeUpload);

// Document CRUD
router.get('/',        requireAuth, listDocuments);
router.get('/:id',     requireAuth, getDocument);
router.patch('/:id',   requireAuth, updateDocument);
router.delete('/:id',  requireAuth, deleteDocument);

// Download — returns a presigned GET URL
router.get('/:id/download', requireAuth, downloadDocument);

export default router;
