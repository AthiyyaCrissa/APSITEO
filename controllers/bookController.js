const Book = require('../models/Book');
const Loan = require('../models/Loan');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');

// GET /api/books
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data buku.', error: err.message });
  }
};

// POST /api/books/:id/borrow
exports.borrowBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Buku tidak ditemukan.' });
    }
    if (book.status === 'Borrowed') {
      return res.status(400).json({ message: 'Buku ini sedang tidak tersedia.' });
    }

    const settings = await Settings.getSingleton();

    const borrowedAt = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (settings.loanDurationDays || 14));

    book.status = 'Borrowed';
    book.borrowedBy = req.user.id; // didapat dari token JWT (authMiddleware)
    book.borrowedAt = borrowedAt;
    book.dueDate = dueDate;
    await book.save();

    // Catat transaksi ini di Loan supaya masuk riwayat (Book.js cuma nyimpen yang aktif)
    await Loan.create({
      book: book._id,
      user: req.user.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookImg: book.img,
      borrowedAt,
      dueDate,
      status: 'dipinjam',
    });

    await Notification.create({
      user: req.user.id,
      type: 'loan_confirmed',
      title: 'Peminjaman dikonfirmasi',
      message: `Peminjaman buku "${book.title}" telah dikonfirmasi. Batas kembali: ${dueDate.toLocaleDateString('id-ID')}.`,
    });

    res.json({ message: `"${book.title}" berhasil dipinjam!`, book });
  } catch (err) {
    res.status(500).json({ message: 'Gagal meminjam buku.', error: err.message });
  }
};

// POST /api/books/:id/return (dipakai member buat kembaliin bukunya sendiri)
exports.returnBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Buku tidak ditemukan.' });
    }
    if (book.status !== 'Borrowed' || String(book.borrowedBy) !== String(req.user.id)) {
      return res.status(400).json({ message: 'Buku ini bukan sedang kamu pinjam.' });
    }

    const loan = await Loan.findOne({ book: book._id, user: req.user.id, returnedAt: null });
    if (!loan) {
      return res.status(404).json({ message: 'Data peminjaman tidak ditemukan.' });
    }

    const settings = await Settings.getSingleton();
    const returnedAt = new Date();
    const fineAmount = loan.calculateFine(returnedAt, settings.finePerDay);

    loan.returnedAt = returnedAt;
    loan.status = 'dikembalikan';
    loan.fineAmount = fineAmount;
    loan.finePaid = fineAmount === 0;
    await loan.save();

    book.status = 'Available';
    book.borrowedBy = null;
    book.borrowedAt = null;
    book.dueDate = null;
    await book.save();

    if (fineAmount > 0) {
      await Notification.create({
        user: req.user.id,
        type: 'fine',
        title: 'Pengingat denda',
        message: `Buku "${loan.bookTitle}" dikembalikan terlambat. Denda: Rp ${fineAmount.toLocaleString('id-ID')}.`,
      });
    }

    res.json({ message: `"${loan.bookTitle}" berhasil dikembalikan.`, fineAmount });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengembalikan buku.', error: err.message });
  }
};

// GET /api/books/my-loans -> buku yang sedang dipinjam user yang login (dari Book, sesuai kode lama)
exports.getMyLoans = async (req, res) => {
  try {
    const books = await Book.find({ borrowedBy: req.user.id, status: 'Borrowed' });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data pinjaman.', error: err.message });
  }
};

// GET /api/books/my-loans/history -> seluruh riwayat peminjaman user (dipinjam/overdue/dikembalikan)
exports.getLoanHistory = async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user.id }).sort({ borrowedAt: -1 });
    const now = new Date();

    const data = loans.map((loan) => {
      let status = loan.status;
      if (status === 'dipinjam' && loan.dueDate < now) {
        status = 'overdue';
      }
      return {
        id: loan._id,
        title: loan.bookTitle,
        author: loan.bookAuthor,
        cover: loan.bookImg,
        borrowedAt: loan.borrowedAt,
        dueDate: loan.dueDate,
        returnedAt: loan.returnedAt,
        status,
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil riwayat peminjaman.', error: err.message });
  }
};

// ================== ADMIN CRUD BUKU ==================
// Semua di bawah ini butuh authMiddleware + requireAdmin (lihat bookRoutes.js)

// POST /api/books (admin)
exports.createBook = async (req, res) => {
  try {
    const { title, author, category, status, img } = req.body;

    if (!title || !author || !category) {
      return res.status(400).json({ message: 'Judul, pengarang, dan kategori wajib diisi.' });
    }

    const book = await Book.create({
      title,
      author,
      category,
      status: status === 'Borrowed' ? 'Borrowed' : 'Available',
      img: img || '',
    });

    res.status(201).json({ message: 'Buku berhasil ditambahkan.', book });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambahkan buku.', error: err.message });
  }
};

// PUT /api/books/:id (admin)
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Buku tidak ditemukan.' });
    }

    const { title, author, category, status, img } = req.body;

    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (category !== undefined) book.category = category;
    if (img !== undefined) book.img = img;

    // Kalau admin manual ubah status jadi Available, bersihkan data peminjaman aktifnya.
    // (Ini jalur override manual, beda dari alur borrow/return normal member.)
    if (status !== undefined && status !== book.status) {
      if (status === 'Available') {
        book.borrowedBy = null;
        book.borrowedAt = null;
        book.dueDate = null;
      }
      book.status = status;
    }

    await book.save();
    res.json({ message: 'Buku berhasil diperbarui.', book });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui buku.', error: err.message });
  }
};

// DELETE /api/books/:id (admin)
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Buku tidak ditemukan.' });
    }
    if (book.status === 'Borrowed') {
      return res.status(400).json({ message: 'Buku sedang dipinjam, tidak bisa dihapus.' });
    }
    await book.deleteOne();
    res.json({ message: 'Buku berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus buku.', error: err.message });
  }
};