import { Router } from 'express';
import { listUsers, changeUserRole, removeUser } from '../controllers/userController';
import { requireAuth }  from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/',             requireAuth, requireAdmin, listUsers);
router.patch('/:id/role',   requireAuth, requireAdmin, changeUserRole);
router.delete('/:id',       requireAuth, requireAdmin, removeUser);

export default router;
