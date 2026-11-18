/**
 * Middleware: blocks any request whose session role is not 'admin'.
 * Must be used after requireAuth.
 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden. Admins only.' });
}

module.exports = requireAdmin;
