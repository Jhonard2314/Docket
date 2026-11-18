const multer = require('multer');
const multerS3 = require('multer-s3');
const s3Client = require('../config/s3');
const generateS3Key = require('../utils/generateS3Key');
require('dotenv').config();

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
];

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB

/**
 * Multer middleware configured to stream uploads directly to Amazon S3.
 * Files are stored privately; access is granted only via pre-signed URLs.
 */
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'private',
    key: function (req, file, cb) {
      const key = generateS3Key(req.session.userId, file.originalname);
      cb(null, key);
    },
  }),
  limits: { fileSize: FILE_SIZE_LIMIT },
  fileFilter: function (req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and image files are allowed.'));
    }
  },
});

module.exports = upload;
