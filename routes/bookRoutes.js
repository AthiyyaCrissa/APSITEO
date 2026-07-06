const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/adminMiddleware');
const {
  getAllBooks,
  borrowBook,
  returnBook,
  getMyLoans,
  getLoanHistory,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

router.get('/', getAllBooks); // publik, gak perlu login buat liat katalog
router.get('/my-loans', authMiddleware, getMyLoans); // harus login
router.get('/my-loans/history', authMiddleware, getLoanHistory); // riwayat lengkap
router.post('/:id/borrow', authMiddleware, borrowBook); // harus login
router.post('/:id/return', authMiddleware, returnBook); // harus login

// ==== Khusus admin (bookshelf-admin.html) ====
router.post('/', authMiddleware, requireAdmin, createBook);
router.put('/:id', authMiddleware, requireAdmin, updateBook);
router.delete('/:id', authMiddleware, requireAdmin, deleteBook);

module.exports = router;