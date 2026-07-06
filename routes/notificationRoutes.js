const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getMyNotifications, markAllRead, markOneRead } = require('../controllers/notificationController');

router.get('/', authMiddleware, getMyNotifications);
router.post('/read-all', authMiddleware, markAllRead);
router.post('/:id/read', authMiddleware, markOneRead);

module.exports = router;