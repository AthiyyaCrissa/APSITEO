const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    img: { type: String, default: '' },
    status: { type: String, enum: ['Available', 'Borrowed'], default: 'Available' },
    borrowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    borrowedAt: { type: Date, default: null },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
