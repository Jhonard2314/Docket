import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl }     from '@aws-sdk/s3-request-presigner';
import s3Client             from '../config/s3';

/**
 * Returns a 15-minute pre-signed GET URL for a private S3 object.
 */
export async function getPresignedUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key:    s3Key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 900 });
}
