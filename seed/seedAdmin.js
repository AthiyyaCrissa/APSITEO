// seed/seedAdmin.js
// Script sekali jalan buat bikin akun admin pertama di Athenaeum Library.
// Jalankan dari root project:
//   node seed/seedAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ==== GANTI DATA ADMIN DI SINI ====
const ADMIN_DATA = {
  name: 'Admin Athenaeum',
  email: 'admin@athenaeum.com',
  password: 'Admin123', 
};
// ===================================

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Terhubung ke MongoDB');

    const emailLower = ADMIN_DATA.email.toLowerCase();

    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      console.log(`⚠️  Email "${emailLower}" sudah terdaftar (role saat ini: ${existing.role}).`);
      console.log('   Kalau mau jadikan admin, ubah field role user ini langsung di database.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, 10);

    const admin = await User.create({
      name: ADMIN_DATA.name,
      email: emailLower,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Akun admin berhasil dibuat!');
    console.log('----------------------------------');
    console.log('Nama     :', admin.name);
    console.log('Email    :', admin.email);
    console.log('Password :', ADMIN_DATA.password, '(catat baik-baik, tidak disimpan plain di DB)');
    console.log('Role     :', admin.role);
    console.log('----------------------------------');
    console.log('Sekarang bisa login lewat POST /api/auth/login pakai email & password di atas.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal seed admin:', err.message);
    process.exit(1);
  }
}

seedAdmin();