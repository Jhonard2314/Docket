import { Router } from 'express';
import { listCategories, addCategory, editCategory, removeCategory } from '../controllers/categoryController';
import { requireAuth }  from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/',          requireAuth, listCategories);
router.post('/',         requireAuth, requireAdmin, addCategory);
router.patch('/:id',     requireAuth, requireAdmin, editCategory);
router.delete('/:id',    requireAuth, requireAdmin, removeCategory);

export default router;
