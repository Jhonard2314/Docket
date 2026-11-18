const { getAllUsers, updateUserRole, deleteUser } = require('../services/userService');

/** GET /api/users  (admin only) */
async function listUsers(req, res) {
  try {
    const users = await getAllUsers();
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** PATCH /api/users/:id/role  (admin only) */
async function changeUserRole(req, res) {
  try {
    const { role } = req.body;
    const updated = await updateUserRole(req.params.id, role);
    return res.json({ success: true, message: 'User role updated.', user: updated });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/** DELETE /api/users/:id  (admin only) */
async function removeUser(req, res) {
  try {
    if (Number(req.params.id) === req.session.userId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    await deleteUser(req.params.id);
    return res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { listUsers, changeUserRole, removeUser };
