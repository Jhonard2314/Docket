import { Request, Response } from 'express';

type Role = 'EMPLOYEE' | 'DEPARTMENT_HEAD' | 'ADMIN';
import * as svc              from '../services/userService';

function errStatus(code: string) {
  return { NOT_FOUND: 404, CONFLICT: 409 }[code] ?? 500;
}

export async function listUsers(req: Request, res: Response) {
  try {
    const data = await svc.getAllUsers(req.query.q as string | undefined);
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'ERROR', message: err.message } });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const data = await svc.getUserById(req.params.id);
    res.json({ data });
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { name, role, departmentId, isActive } = req.body;
    const data = await svc.updateUser(req.params.id, { name, role: role as Role, departmentId, isActive });
    res.json({ data });
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}

export async function deactivateUser(req: Request, res: Response) {
  try {
    const data = await svc.deactivateUser(req.params.id);
    res.json({ data });
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}
