const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Resolve path to public/uploads in the root directory of the project
    // const uploadPath = path.resolve(__dirname, 'public/uploads');
    const uploadPath = path.resolve(__dirname, '../public/uploads'); // Move up one directory from config

    // Check if the directory exists, if not, create it
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Create directory if it doesn't exist
    }

    cb(null, uploadPath); // Save the files in public/uploads
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

// Create multer instance with the updated storage configuration
const uploads = multer({ storage: storage });

module.exports = uploads;
