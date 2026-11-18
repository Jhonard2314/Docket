const express = require('express');
const router = express.Router();
const { listCategories, addCategory, removeCategory } = require('../controllers/categoryController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', requireAuth, listCategories);
router.post('/', requireAuth, requireAdmin, addCategory);
router.delete('/:id', requireAuth, requireAdmin, removeCategory);

module.exports = router;
