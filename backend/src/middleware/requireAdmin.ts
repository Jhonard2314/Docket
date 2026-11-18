import { Request, Response, NextFunction } from 'express';

/**
 * Blocks non-admin users. Must be used after requireAuth.
 */
export function requireAdmin(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.locals.user?.role === 'ADMIN') {
    next();
    return;
  }
  res.status(403).json({ success: false, message: 'Forbidden. Admins only.' });
}
