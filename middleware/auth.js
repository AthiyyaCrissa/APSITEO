const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; // format: "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login dulu.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // berisi { id, name, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah expired.' });
  }
}

module.exports = authMiddleware;
