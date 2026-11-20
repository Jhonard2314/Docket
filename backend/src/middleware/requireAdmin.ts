import { Request, Response, NextFunction } from 'express';

export function requireAdmin(_req: Request, res: Response, next: NextFunction): void {
  if (res.locals.user?.role === 'ADMIN') { next(); return; }
  res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Administrators only.' } });
}
