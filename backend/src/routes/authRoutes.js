const express = require('express');
const router = express.Router();
const { register, login, logout, me } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/me', me);

module.exports = router;
