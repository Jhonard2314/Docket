import { Router } from 'express';
import { listUsers, getUser, updateUser, deactivateUser } from '../controllers/userController';
import { requireAuth }  from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/',           requireAuth, requireAdmin, listUsers);
router.get('/:id',        requireAuth, requireAdmin, getUser);
router.patch('/:id',      requireAuth, requireAdmin, updateUser);
router.delete('/:id',     requireAuth, requireAdmin, deactivateUser);  // deactivates, doesn't hard-delete

export default router;
