import { Request, Response } from 'express';
import * as svc from '../services/categoryService';

export async function listCategories(_req: Request, res: Response) {
  try {
    const categories = await svc.getAllCategories();
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function addCategory(req: Request, res: Response) {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ success: false, message: 'name is required.' }); return; }
    const category = await svc.createCategory(name.trim());
    res.status(201).json({ success: true, category });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function removeCategory(req: Request, res: Response) {
  try {
    await svc.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}
