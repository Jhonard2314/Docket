const pool = require('../config/db');
const hashPassword = require('../utils/hashPassword');
const comparePassword = require('../utils/comparePassword');

/**
 * Registers a new user.
 * Returns the newly created user record (without password_hash).
 */
async function registerUser(name, email, password, role = 'user') {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new Error('Email is already registered.');
  }
  const hash = await hashPassword(password);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, hash, role]
  );
  return { id: result.insertId, name, email, role };
}

/**
 * Validates credentials and returns the matching user object.
 * Throws an error if the email or password is wrong.
 */
async function loginUser(email, password) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    throw new Error('Invalid email or password.');
  }
  const user = rows[0];
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid email or password.');
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

module.exports = { registerUser, loginUser };
