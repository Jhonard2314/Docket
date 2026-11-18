import { Request, Response } from 'express';
import { Role }              from '@prisma/client';
import * as svc              from '../services/userService';

export async function listUsers(_req: Request, res: Response) {
  try {
    const users = await svc.getAllUsers();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function changeUserRole(req: Request, res: Response) {
  try {
    const { role } = req.body;
    const updated = await svc.updateUserRole(req.params.id, role as Role);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function removeUser(req: Request, res: Response) {
  try {
    if (req.params.id === res.locals.user.id) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
      return;
    }
    await svc.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
