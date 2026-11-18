import multer      from 'multer';
import multerS3    from 'multer-s3';
import s3Client    from '../config/s3';
import { generateS3Key } from '../utils/generateS3Key';
import { Request }       from 'express';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
];

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB

/**
 * Multer middleware: streams uploads directly to the private S3 bucket.
 * Files are never written to the EC2 instance disk.
 */
const upload = multer({
  storage: multerS3({
    s3:          s3Client,
    bucket:      process.env.S3_BUCKET_NAME as string,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req: Request, file, cb) => {
      const userId = (_req as any).locals?.user?.id ?? 'unknown';
      cb(null, generateS3Key(userId, file.originalname));
    },
  }),
  limits:     { fileSize: FILE_SIZE_LIMIT },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, Word, JPG, PNG, GIF.'));
    }
  },
});

export default upload;
