const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/adminMiddleware');
const {
  getStats,
  getPopularBooks,
  getAllLoans,
  verifyLoanReturn,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');

router.get('/stats', authMiddleware, requireAdmin, getStats);
router.get('/popular-books', authMiddleware, requireAdmin, getPopularBooks);
router.get('/loans', authMiddleware, requireAdmin, getAllLoans);
router.post('/loans/:id/verify', authMiddleware, requireAdmin, verifyLoanReturn);

router.get('/users', authMiddleware, requireAdmin, getAllUsers);
router.post('/users', authMiddleware, requireAdmin, createUser);
router.put('/users/:id', authMiddleware, requireAdmin, updateUser);
router.delete('/users/:id', authMiddleware, requireAdmin, deleteUser);

module.exports = router;