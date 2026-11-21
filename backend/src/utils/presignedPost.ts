import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import s3Client from '../config/s3';
import { MAX_FILE_BYTES } from '../middleware/uploadMiddleware';

/**
 * Generates a short-lived S3 presigned POST policy.
 * The browser uploads directly to S3 using the returned url + fields.
 * Grant lifetime: 5 minutes.
 */
export async function getPresignedPost(
  key: string,
  contentType: string,
  sizeBytes: number,
): Promise<{ url: string; fields: Record<string, string> }> {
  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket:     process.env.S3_BUCKET_NAME as string,
    Key:        key,
    Expires:    300,
    Conditions: [
      { 'Content-Type': contentType },
      ['content-length-range', 1, Math.min(sizeBytes + 1024, MAX_FILE_BYTES)],
    ],
    Fields: { 'Content-Type': contentType },
  });
  return { url, fields: fields as Record<string, string> };
}
