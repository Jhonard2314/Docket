const { registerUser, loginUser } = require('../services/authService');

/** POST /api/auth/register */
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    const user = await registerUser(name, email, password, role);
    return res.status(201).json({ success: true, message: 'Registration successful.', user });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/** POST /api/auth/login */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = await loginUser(email, password);
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.name = user.name;
    return res.json({ success: true, message: 'Login successful.', user });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
}

/** POST /api/auth/logout */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Could not log out.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
}

/** GET /api/auth/me — returns current session user */
function me(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  return res.json({
    success: true,
    user: { id: req.session.userId, name: req.session.name, role: req.session.role },
  });
}

module.exports = { register, login, logout, me };
