
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();
const multer = require('multer');


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'product-images',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const uploads = multer({ storage }).fields([
  { name: 'productImage1', maxCount: 1 },
  { name: 'productImage2', maxCount: 1 },
  { name: 'productImage3', maxCount: 1 },
  { name: 'productImage4', maxCount: 1 },
]);


module.exports = { cloudinary, uploads };

