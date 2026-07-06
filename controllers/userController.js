const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Loan = require('../models/Loan');

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const totalBorrowed = await Loan.countDocuments({ user: user._id });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      birthDate: user.birthDate,
      address: user.address,
      memberId: user.memberId,
      membershipType: user.membershipType,
      membershipExpiry: user.membershipExpiry,
      maxBorrow: user.maxBorrow,
      joinedAt: user.createdAt,
      totalBorrowed,
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil profil.', error: err.message });
  }
};

// PUT /api/users/me
exports.updateMe = async (req, res) => {
  try {
    const { name, email, phone, birthDate, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Nama dan email wajib diisi.' });
    }

    if (email.toLowerCase() !== req.user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing && String(existing._id) !== String(req.user.id)) {
        return res.status(409).json({ message: 'Email sudah dipakai akun lain.' });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    user.name = name;
    user.email = email.toLowerCase();
    user.phone = phone || '';
    user.birthDate = birthDate ? new Date(birthDate) : null;
    user.address = address || '';
    await user.save();

    res.json({
      message: 'Profil berhasil diperbarui.',
      name: user.name,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      address: user.address,
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui profil.', error: err.message });
  }
};

// POST /api/users/change-password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Password lama dan baru wajib diisi.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password baru minimal 8 karakter.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password lama salah.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui password.', error: err.message });
  }
};