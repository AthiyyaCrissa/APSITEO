const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/adminMiddleware');
const { getSettings, updateSettings, resetSettings } = require('../controllers/settingsController');

router.get('/', authMiddleware, getSettings); // member juga boleh baca (butuh tau durasi pinjam/denda)
router.put('/', authMiddleware, requireAdmin, updateSettings);
router.post('/reset', authMiddleware, requireAdmin, resetSettings);

module.exports = router;