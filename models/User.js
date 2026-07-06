const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // sudah di-hash, bukan plain text
    role: { type: String, enum: ['member', 'admin'], default: 'member' },

    // ==== field tambahan buat halaman profil ====
    phone: { type: String, default: '' },
    birthDate: { type: Date, default: null },
    address: { type: String, default: '' },

    memberId: { type: String, unique: true, sparse: true }, // contoh: LIB-00123
    membershipType: { type: String, enum: ['Reguler', 'Premium'], default: 'Reguler' },
    membershipExpiry: { type: Date, default: null },
    maxBorrow: { type: Number, default: 7 },

    // status keanggotaan, dipakai di halaman anggota-admin.html
    status: { type: String, enum: ['Aktif', 'Tidak Aktif'], default: 'Aktif' },
  },
  { timestamps: true } // createdAt dipakai sebagai "Bergabung sejak"
);

// Auto-generate memberId saat user baru dibuat, format: LIB-00001, LIB-00002, dst.
userSchema.pre('save', async function (next) {
  if (this.memberId) return next();
  try {
    const count = await mongoose.model('User').countDocuments();
    this.memberId = 'LIB-' + String(count + 1).padStart(5, '0');
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);