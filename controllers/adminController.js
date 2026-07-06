const bcrypt = require('bcryptjs');
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');

// GET /api/admin/stats -> 4 kartu statistik di dashboard-admin.html
exports.getStats = async (req, res) => {
  try {
    const totalAnggota = await User.countDocuments({ role: 'member' });
    const totalBuku = await Book.countDocuments();
    const bukuDipinjam = await Book.countDocuments({ status: 'Borrowed' });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const transaksiHariIni = await Loan.countDocuments({
      borrowedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json({ totalAnggota, totalBuku, bukuDipinjam, transaksiHariIni });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil statistik.', error: err.message });
  }
};

// GET /api/admin/popular-books -> "Paling Banyak Dipinjam" di dashboard-admin.html
exports.getPopularBooks = async (req, res) => {
  try {
    const result = await Loan.aggregate([
      {
        $group: {
          _id: '$book',
          title: { $first: '$bookTitle' },
          author: { $first: '$bookAuthor' },
          img: { $first: '$bookImg' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const max = result.length ? result[0].count : 1;
    const data = result.map((r) => ({
      title: r.title,
      author: r.author,
      img: r.img,
      count: r.count,
      percent: Math.round((r.count / max) * 100),
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data buku populer.', error: err.message });
  }
};

// GET /api/admin/loans -> dipakai transaksi-admin.html DAN reports-admin.html
// (semua transaksi peminjaman, dari semua anggota)
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate('user', 'name memberId').sort({ borrowedAt: -1 });
    const now = new Date();

    const data = loans.map((loan) => {
      let status = loan.status;
      if (status === 'dipinjam' && loan.dueDate < now) {
        status = 'overdue';
      }
      return {
        id: loan._id,
        nama: loan.user ? loan.user.name : 'Anggota terhapus',
        idAnggota: loan.user ? loan.user.memberId : '-',
        buku: loan.bookTitle,
        tglPinjam: loan.borrowedAt,
        tglKembali: loan.returnedAt || loan.dueDate,
        status, // 'dipinjam' | 'overdue' | 'dikembalikan'
        denda: loan.fineAmount,
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data transaksi.', error: err.message });
  }
};

// POST /api/admin/loans/:id/verify
// Dipanggil admin waktu anggota mengembalikan buku secara fisik ke perpustakaan.
// :id di sini adalah ID dari Loan (bukan Book).
exports.verifyLoanReturn = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }
    if (loan.returnedAt) {
      return res.status(400).json({ message: 'Transaksi ini sudah diverifikasi sebelumnya.' });
    }

    const settings = await Settings.getSingleton();
    const returnedAt = new Date();
    const fineAmount = loan.calculateFine(returnedAt, settings.finePerDay);

    loan.returnedAt = returnedAt;
    loan.status = 'dikembalikan';
    loan.fineAmount = fineAmount;
    loan.finePaid = fineAmount === 0;
    await loan.save();

    const book = await Book.findById(loan.book);
    if (book && book.borrowedBy && String(book.borrowedBy) === String(loan.user)) {
      book.status = 'Available';
      book.borrowedBy = null;
      book.borrowedAt = null;
      book.dueDate = null;
      await book.save();
    }

    if (fineAmount > 0) {
      await Notification.create({
        user: loan.user,
        type: 'fine',
        title: 'Pengingat denda',
        message: `Buku "${loan.bookTitle}" dikembalikan terlambat. Denda: Rp ${fineAmount.toLocaleString('id-ID')}.`,
      });
    }

    res.json({ message: 'Transaksi berhasil diverifikasi.', fineAmount });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memverifikasi transaksi.', error: err.message });
  }
};

// Helper: generate password sementara buat anggota baru yang dibuat admin
function generateTempPassword() {
  return Math.random().toString(36).slice(-8) + 'A1!';
}

// GET /api/admin/users -> dipakai anggota-admin.html
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'member' }).sort({ createdAt: -1 });

    const data = await Promise.all(
      users.map(async (u) => {
        const pinjam = await Loan.countDocuments({
          user: u._id,
          status: { $in: ['dipinjam', 'overdue'] },
        });
        return {
          id: u.memberId,
          _id: u._id,
          nama: u.name,
          email: u.email,
          telepon: u.phone || '',
          tipe: u.membershipType,
          status: u.status,
          pinjam,
        };
      })
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data anggota.', error: err.message });
  }
};

// POST /api/admin/users -> tambah anggota baru dari anggota-admin.html
exports.createUser = async (req, res) => {
  try {
    const { nama, email, telepon, tipe, status } = req.body;

    if (!nama || !email) {
      return res.status(400).json({ message: 'Nama dan email wajib diisi.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await User.create({
      name: nama,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'member',
      phone: telepon || '',
      membershipType: tipe || 'Reguler',
      status: status || 'Aktif',
    });

    res.status(201).json({
      message: 'Anggota berhasil ditambahkan.',
      tempPassword, // ditampilkan sekali ke admin biar bisa dikasih ke anggota
      user: {
        id: newUser.memberId,
        _id: newUser._id,
        nama: newUser.name,
        email: newUser.email,
        telepon: newUser.phone,
        tipe: newUser.membershipType,
        status: newUser.status,
        pinjam: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambah anggota.', error: err.message });
  }
};

// PUT /api/admin/users/:id -> edit anggota
exports.updateUser = async (req, res) => {
  try {
    const { nama, email, telepon, tipe, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'member') {
      return res.status(404).json({ message: 'Anggota tidak ditemukan.' });
    }

    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing && String(existing._id) !== String(user._id)) {
        return res.status(409).json({ message: 'Email sudah dipakai akun lain.' });
      }
      user.email = email.toLowerCase();
    }

    if (nama) user.name = nama;
    if (telepon !== undefined) user.phone = telepon;
    if (tipe) user.membershipType = tipe;
    if (status) user.status = status;

    await user.save();

    res.json({ message: 'Data anggota berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui anggota.', error: err.message });
  }
};

// DELETE /api/admin/users/:id -> hapus anggota
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'member') {
      return res.status(404).json({ message: 'Anggota tidak ditemukan.' });
    }

    const activeLoans = await Loan.countDocuments({
      user: user._id,
      status: { $in: ['dipinjam', 'overdue'] },
    });
    if (activeLoans > 0) {
      return res.status(400).json({ message: 'Anggota masih punya pinjaman aktif, tidak bisa dihapus.' });
    }

    await user.deleteOne();
    res.json({ message: 'Anggota berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus anggota.', error: err.message });
  }
};