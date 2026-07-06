const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getActiveFines, getFineHistory, payFine } = require('../controllers/finesController');

router.get('/active', authMiddleware, getActiveFines);
router.get('/history', authMiddleware, getFineHistory);
router.post('/:id/pay', authMiddleware, payFine);

module.exports = router;