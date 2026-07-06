const Settings = require('../models/Settings');

const DEFAULTS = {
  libraryName: 'Athenaeum Library',
  loanDurationDays: 14,
  finePerDay: 1000,
  maxBorrowDefault: 7,
  notifDueSoon: true,
  notifOverdue: true,
  notifNewRequest: true,
};

// GET /api/settings -> boleh diakses siapa saja yang login (member butuh tau durasi pinjam & denda/hari)
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil pengaturan.', error: err.message });
  }
};

// PUT /api/settings -> admin only
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    const {
      libraryName,
      loanDurationDays,
      finePerDay,
      maxBorrowDefault,
      notifDueSoon,
      notifOverdue,
      notifNewRequest,
    } = req.body;

    if (libraryName !== undefined) settings.libraryName = libraryName;
    if (loanDurationDays !== undefined) settings.loanDurationDays = Number(loanDurationDays);
    if (finePerDay !== undefined) settings.finePerDay = Number(finePerDay);
    if (maxBorrowDefault !== undefined) settings.maxBorrowDefault = Number(maxBorrowDefault);
    if (notifDueSoon !== undefined) settings.notifDueSoon = Boolean(notifDueSoon);
    if (notifOverdue !== undefined) settings.notifOverdue = Boolean(notifOverdue);
    if (notifNewRequest !== undefined) settings.notifNewRequest = Boolean(notifNewRequest);

    await settings.save();
    res.json({ message: 'Pengaturan berhasil disimpan.', settings });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menyimpan pengaturan.', error: err.message });
  }
};

// POST /api/settings/reset -> admin only, kembalikan semua ke nilai default
exports.resetSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    Object.assign(settings, DEFAULTS);
    await settings.save();
    res.json({ message: 'Pengaturan direset ke default.', settings });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mereset pengaturan.', error: err.message });
  }
};