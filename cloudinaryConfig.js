const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// 1. إعطاء السوارت لـ Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. إعداد المخزن (فين غيتحطو التصاور)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ninja_cars_dossiers', // هادي سمية الدوسي اللي غيتكريا فـ Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});

// 3. تصدير أداة الرفع (Upload)
const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };