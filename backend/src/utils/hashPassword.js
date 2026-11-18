const bcrypt = require('bcryptjs');

/**
 * Hashes a plain-text password using bcrypt.
 * @param {string} plainPassword
 * @returns {Promise<string>} hashed password
 */
async function hashPassword(plainPassword) {
  const saltRounds = 12;
  return bcrypt.hash(plainPassword, saltRounds);
}

module.exports = hashPassword;
