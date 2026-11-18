const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');
require('dotenv').config();

/**
 * Generates a temporary pre-signed URL for a private S3 object.
 * The URL is valid for 15 minutes (900 seconds).
 * @param {string} s3Key - The object key stored in the database.
 * @returns {Promise<string>} Pre-signed download URL
 */
async function getPresignedUrl(s3Key) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 900 });
}

module.exports = getPresignedUrl;
