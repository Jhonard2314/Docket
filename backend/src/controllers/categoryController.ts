import { Request, Response } from 'express';
import * as svc from '../services/categoryService';

function errStatus(code: string) {
  return { NOT_FOUND: 404, CONFLICT: 409 }[code] ?? 500;
}

export async function listCategories(req: Request, res: Response) {
  try {
    const data = await svc.getAllCategories(req.query.q as string | undefined);
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'ERROR', message: err.message } });
  }
}

export async function addCategory(req: Request, res: Response) {
  try {
    const { name } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'name is required.' } }); return; }
    const data = await svc.createCategory(name.trim());
    res.status(201).json({ data });
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}

export async function editCategory(req: Request, res: Response) {
  try {
    const { name } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'name is required.' } }); return; }
    const data = await svc.updateCategory(req.params.id, name.trim());
    res.json({ data });
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}

export async function removeCategory(req: Request, res: Response) {
  try {
    await svc.deleteCategory(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(errStatus(err.code)).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
  }
}
