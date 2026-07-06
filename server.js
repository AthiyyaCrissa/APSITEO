require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');
const finesRoutes = require('./routes/finesRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/Adminroutes');   
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fines', finesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);


const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server jalan di http://localhost:${PORT}`);
  });
});