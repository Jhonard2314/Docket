import multer from 'multer';

/**
 * Memory-storage multer — used only for the completion endpoint to inspect
 * the uploaded file content type and size after S3 receives it.
 *
 * The actual upload to S3 happens directly from the browser using a
 * presigned POST URL returned by POST /api/documents/uploads.
 * Files never stream through the Express process for the primary upload path.
 */

export const ALLOWED_MIME_TYPES: Record<string, true> = {
  'application/pdf':                                                        true,
  'application/msword':                                                     true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':      true,
  'text/plain':                                                             true,
  'image/jpeg':                                                             true,
  'image/png':                                                              true,
};

export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xlsx', '.txt', '.jpg', '.jpeg', '.png'];

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MiB

/** Multer instance for in-memory handling (completion / server-side inspection). */
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Supported: PDF, DOCX, XLSX, TXT, PNG, JPEG.`));
    }
  },
});
