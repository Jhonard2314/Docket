import path from 'path';
import crypto from 'crypto';

/**
 * Generates a unique, collision-resistant S3 object key.
 * Format: uploads/<userId>/<timestamp>-<random8hex>.<ext>
 */
export function generateS3Key(userId: string, originalName: string): string {
  const ext       = path.extname(originalName);
  const randomHex = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  return `uploads/${userId}/${timestamp}-${randomHex}${ext}`;
}
