import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client               from '../config/s3';

/**
 * Permanently removes an object from the private S3 bucket.
 */
export async function deleteS3Object(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key:    s3Key,
  });
  await s3Client.send(command);
}
