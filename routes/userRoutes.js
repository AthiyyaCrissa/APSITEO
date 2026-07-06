const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getMe, updateMe, changePassword } = require('../controllers/userController');

router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.post('/change-password', authMiddleware, changePassword);

module.exports = router;