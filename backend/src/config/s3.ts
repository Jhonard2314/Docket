import { S3Client } from '@aws-sdk/client-s3';

/**
 * S3 client — on EC2 uses the attached IAM Role automatically.
 * Locally, set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY in .env.
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
});

export default s3Client;
