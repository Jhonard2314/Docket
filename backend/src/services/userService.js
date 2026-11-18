const pool = require('../config/db');

/** Returns all users (admin only). Password hashes are excluded. */
async function getAllUsers() {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
}

/** Returns a single user by ID. */
async function getUserById(userId) {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) throw new Error('User not found.');
  return rows[0];
}

/** Updates a user's role (admin only). */
async function updateUserRole(userId, newRole) {
  const allowed = ['admin', 'user'];
  if (!allowed.includes(newRole)) throw new Error('Invalid role.');
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
  return getUserById(userId);
}

/** Deletes a user and all their documents (admin only). */
async function deleteUser(userId) {
  await pool.query('DELETE FROM documents WHERE uploaded_by = ?', [userId]);
  await pool.query('DELETE FROM users WHERE id = ?', [userId]);
}

module.exports = { getAllUsers, getUserById, updateUserRole, deleteUser };
