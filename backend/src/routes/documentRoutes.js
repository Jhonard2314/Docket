const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  listDocuments,
  renameDoc,
  deleteDoc,
  downloadDoc,
} = require('../controllers/documentController');
const requireAuth = require('../middleware/requireAuth');
const upload = require('../middleware/uploadMiddleware');

router.get('/', requireAuth, listDocuments);
router.post('/upload', requireAuth, upload.single('file'), uploadDocument);
router.get('/:id/download', requireAuth, downloadDoc);
router.patch('/:id/rename', requireAuth, renameDoc);
router.delete('/:id', requireAuth, deleteDoc);

module.exports = router;
