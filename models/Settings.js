const mongoose = require('mongoose');

// Settings itu dokumen TUNGGAL (singleton) — cuma ada 1 dokumen di collection ini,
// isinya konfigurasi sistem yang bisa diubah admin lewat settings-admin.html.
const settingsSchema = new mongoose.Schema(
  {
    libraryName: { type: String, default: 'Athenaeum Library' },
    loanDurationDays: { type: Number, default: 14 },
    finePerDay: { type: Number, default: 1000 },
    maxBorrowDefault: { type: Number, default: 7 },
    notifDueSoon: { type: Boolean, default: true },
    notifOverdue: { type: Boolean, default: true },
    notifNewRequest: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Ambil dokumen settings satu-satunya; kalau belum ada, buat dengan nilai default.
settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);