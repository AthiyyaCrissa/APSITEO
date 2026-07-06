const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Atlas terhubung');
  } catch (err) {
    console.error('❌ Gagal konek ke MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
