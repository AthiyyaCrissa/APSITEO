const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['overdue', 'due_soon', 'book_available', 'fine', 'loan_confirmed', 'membership'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // opsional, override link default di frontend
    read: { type: Boolean, default: false },
  },
  { timestamps: true } // createdAt dipakai frontend buat tampilin "X jam lalu"
);

module.exports = mongoose.model('Notification', notificationSchema);