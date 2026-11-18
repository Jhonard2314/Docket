import { Router } from 'express';
import { uploadDocument, listDocuments, renameDoc, deleteDoc, downloadDoc } from '../controllers/documentController';
import { requireAuth } from '../middleware/requireAuth';
import upload          from '../middleware/uploadMiddleware';

const router = Router();

router.get('/',                requireAuth, listDocuments);
router.post('/upload',         requireAuth, upload.single('file'), uploadDocument);
router.get('/:id/download',    requireAuth, downloadDoc);
router.patch('/:id/rename',    requireAuth, renameDoc);
router.delete('/:id',          requireAuth, deleteDoc);

export default router;
