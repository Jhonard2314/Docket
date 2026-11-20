import { Router } from 'express';
import { listDepartments, addDepartment, editDepartment, removeDepartment } from '../controllers/departmentController';
import { requireAuth }  from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/',          requireAuth, listDepartments);
router.post('/',         requireAuth, requireAdmin, addDepartment);
router.patch('/:id',     requireAuth, requireAdmin, editDepartment);
router.delete('/:id',    requireAuth, requireAdmin, removeDepartment);

export default router;
