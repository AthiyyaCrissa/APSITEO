require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const sampleBooks = [
  { title: "Design for the Real World", author: "Victor Papanek", category: "Design", status: "Available", img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400" },
  { title: "Sapiens: A Brief History", author: "Yuval Noah Harari", category: "Sejarah", status: "Available", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400" },
  { title: "The Design of Everyday Things", author: "Don Norman", category: "Design", status: "Available", img: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400" },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", category: "Sains", status: "Available", img: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400" },
  { title: "Brief Answers to the Big Questions", author: "Stephen Hawking", category: "Sains", status: "Available", img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Fiksi", status: "Available", img: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400" },
  { title: "A Promised Land", author: "Barack Obama", category: "Sejarah", status: "Available", img: "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400" },
  { title: "Invisible Women", author: "Caroline Criado Perez", category: "Sains", status: "Available", img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400" },
  { title: "Clean Code", author: "Robert C. Martin", category: "Teknologi", status: "Available", img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400" },
  { title: "The Pragmatic Programmer", author: "David Thomas", category: "Teknologi", status: "Available", img: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=400" },
  { title: "Dune", author: "Frank Herbert", category: "Fiksi", status: "Available", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" },
  { title: "Atomic Habits", author: "James Clear", category: "Sains", status: "Available", img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Terhubung ke MongoDB');

    await Book.deleteMany({}); // bersihin data buku lama (kalau ada) biar gak duplikat
    await Book.insertMany(sampleBooks);

    console.log(`✅ Berhasil masukin ${sampleBooks.length} buku contoh.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal seed data:', err.message);
    process.exit(1);
  }
}

seed();
