const Notification = require('../models/Notification');

// GET /api/notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil notifikasi.', error: err.message });
  }
};

// POST /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { $set: { read: true } });
    res.json({ message: 'Semua notifikasi ditandai dibaca.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menandai notifikasi.', error: err.message });
  }
};

// POST /api/notifications/:id/read
exports.markOneRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!notif) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan.' });
    }
    notif.read = true;
    await notif.save();
    res.json({ message: 'Notifikasi ditandai dibaca.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menandai notifikasi.', error: err.message });
  }
};