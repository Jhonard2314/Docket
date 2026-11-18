const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
require('dotenv').config();

/**
 * Permanently deletes an object from Amazon S3.
 * @param {string} s3Key - The object key to delete.
 * @returns {Promise<void>}
 */
async function deleteS3Object(s3Key) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
  });
  await s3Client.send(command);
}

module.exports = deleteS3Object;
