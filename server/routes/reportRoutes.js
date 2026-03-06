const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createReport } = require('../controllers/reportController');

// Set up Multer to save photos to the /uploads folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// This is the door that was missing!
router.post('/', upload.single('photo'), createReport);

module.exports = router;