import { Router } from 'express';
import { listCategories, addCategory, removeCategory } from '../controllers/categoryController';
import { requireAuth }  from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/',    requireAuth, listCategories);
router.post('/',   requireAuth, requireAdmin, addCategory);
router.delete('/:id', requireAuth, requireAdmin, removeCategory);

export default router;
