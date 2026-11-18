const path = require('path');
const crypto = require('crypto');

/**
 * Generates a unique S3 object key for an uploaded file.
 * Format: uploads/<userId>/<timestamp>-<random>.<ext>
 * @param {number} userId
 * @param {string} originalName
 * @returns {string}
 */
function generateS3Key(userId, originalName) {
  const ext = path.extname(originalName);
  const randomHex = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  return `uploads/${userId}/${timestamp}-${randomHex}${ext}`;
}

module.exports = generateS3Key;
