const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

/**
 * Creates and exports a reusable S3 client.
 * On EC2 the client automatically uses the attached IAM role — no access keys needed.
 * For local development, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

module.exports = s3Client;
