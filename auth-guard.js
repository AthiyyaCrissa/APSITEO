// ============================================================
// AUTH GUARD - Athenaeum Library
// Cek apakah user sudah login dan role-nya sesuai dengan
// yang diizinkan (ATHENAEUM_ALLOWED_ROLES) untuk halaman ini.
// Kalau tidak sesuai -> tendang ke halaman login.
// ============================================================
(function () {
  try {
    const userRaw = localStorage.getItem('athenaeum_current_user');
    const user = userRaw ? JSON.parse(userRaw) : null;

    // Baca allowedRoles dari window (di-set di setiap halaman
    // sebelum script ini di-load)
    const allowedRoles = window.ATHENAEUM_ALLOWED_ROLES || [];

    if (!user || !allowedRoles.includes(user.role)) {
      // Belum login / role tidak sesuai -> tendang ke halaman login
      window.location.href = 'index.html';
    }
  } catch (e) {
    // Data rusak / corrupt -> aman-nya tendang ke login juga
    window.location.href = 'index.html';
  }
})();