const Loan = require('../models/Loan');
const Settings = require('../models/Settings');

// GET /api/fines/active
// Denda aktif = buku yang MASIH dipinjam (belum dikembalikan) dan SUDAH lewat jatuh tempo,
// dan belum ditandai lunas.
exports.getActiveFines = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    const now = new Date();
    const loans = await Loan.find({
      user: req.user.id,
      returnedAt: null,
      dueDate: { $lt: now },
      finePaid: false,
    }).sort({ dueDate: 1 });

    const data = loans.map((loan) => {
      const overdueDays = loan.getOverdueDays(now);
      const amount = loan.calculateFine(now, settings.finePerDay);
      return {
        id: loan._id,
        title: loan.bookTitle,
        cover: loan.bookImg,
        borrowedAt: loan.borrowedAt,
        dueDate: loan.dueDate,
        overdueDays,
        amount,
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data denda aktif.', error: err.message });
  }
};

// GET /api/fines/history -> denda yang sudah lunas dibayar
exports.getFineHistory = async (req, res) => {
  try {
    const loans = await Loan.find({
      user: req.user.id,
      finePaid: true,
      fineAmount: { $gt: 0 },
    }).sort({ finePaidAt: -1 });

    const data = loans.map((loan) => ({
      id: loan._id,
      title: loan.bookTitle,
      amount: loan.fineAmount,
      paidAt: loan.finePaidAt,
      method: loan.finePaymentMethod,
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil riwayat denda.', error: err.message });
  }
};

// POST /api/fines/:id/pay
// :id di sini adalah ID dari Loan (bukan Book).
exports.payFine = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: 'Data denda tidak ditemukan.' });
    }
    if (String(loan.user) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Kamu tidak berhak membayar denda ini.' });
    }
    if (loan.finePaid) {
      return res.status(400).json({ message: 'Denda ini sudah lunas.' });
    }

    const { method } = req.body;
    const now = new Date();
    const settings = await Settings.getSingleton();

    // Snapshot nominal denda pada saat pembayaran (kalau buku belum dikembalikan,
    // hitung ulang berdasarkan hari ini; kalau sudah dikembalikan, pakai fineAmount yang sudah tersimpan).
    const amount = loan.returnedAt ? loan.fineAmount : loan.calculateFine(now, settings.finePerDay);

    loan.fineAmount = amount;
    loan.finePaid = true;
    loan.finePaidAt = now;
    loan.finePaymentMethod = method || 'Transfer Bank';
    await loan.save();

    res.json({ message: 'Pembayaran denda berhasil.', amount });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memproses pembayaran denda.', error: err.message });
  }
};