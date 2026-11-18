const express = require('express');
const router = express.Router();
const { listUsers, changeUserRole, removeUser } = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', requireAuth, requireAdmin, listUsers);
router.patch('/:id/role', requireAuth, requireAdmin, changeUserRole);
router.delete('/:id', requireAuth, requireAdmin, removeUser);

module.exports = router;
