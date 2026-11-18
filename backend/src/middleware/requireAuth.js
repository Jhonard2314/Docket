/**
 * Middleware: blocks any request that does not have an active session.
 * Returns 401 JSON for API callers, so the frontend can redirect to login.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
}

module.exports = requireAuth;
