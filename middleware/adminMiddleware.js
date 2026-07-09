// Dipakai SETELAH authMiddleware, jadi req.user sudah pasti ada.
// authMiddleware men-decode JWT yang isinya { id, name, email, role }.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak. Halaman ini khusus admin.' });
  }
  next();
}

module.exports = requireAdmin;