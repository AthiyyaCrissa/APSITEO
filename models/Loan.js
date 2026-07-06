const mongoose = require('mongoose');

// Loan menyimpan SATU transaksi peminjaman (histori), beda dengan Book.js
// yang cuma nyimpen peminjaman AKTIF saat ini di dalam dokumen buku.
// Setiap kali borrowBook() dipanggil, satu Loan baru dibuat.
// Setiap kali returnBook() / verifyLoanReturn() dipanggil, Loan di-update (returnedAt, fine, dst).
const loanSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // snapshot data buku saat dipinjam, biar riwayat tetap tampil
    // meskipun bukunya nanti diedit/dihapus dari katalog
    bookTitle: { type: String, required: true },
    bookAuthor: { type: String, required: true },
    bookImg: { type: String, default: '' },

    borrowedAt: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ['dipinjam', 'overdue', 'dikembalikan'],
      default: 'dipinjam',
    },

    fineAmount: { type: Number, default: 0 },
    finePaid: { type: Boolean, default: false },
    finePaidAt: { type: Date, default: null },
    finePaymentMethod: { type: String, default: null },
  },
  { timestamps: true }
);

// Helper: hitung berapa hari terlambat dari suatu tanggal acuan (default: sekarang)
loanSchema.methods.getOverdueDays = function (referenceDate = new Date()) {
  const diffMs = referenceDate - this.dueDate;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const DENDA_PER_HARI_DEFAULT = 1000;

// finePerDay bisa dioverride dari Settings (lihat Settings.js), fallback ke default
// kalau tidak diberikan (misalnya di kode lama yang belum sempat diupdate).
loanSchema.methods.calculateFine = function (referenceDate = new Date(), finePerDay = DENDA_PER_HARI_DEFAULT) {
  return this.getOverdueDays(referenceDate) * finePerDay;
};

module.exports = mongoose.model('Loan', loanSchema);
module.exports.DENDA_PER_HARI_DEFAULT = DENDA_PER_HARI_DEFAULT;