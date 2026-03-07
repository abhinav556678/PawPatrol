const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// 🚨 IMPORT THE NEW FUNCTIONS HERE
const { createReport, getAllReports, updateReportStatus } = require('../controllers/reportController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage });

// The door to create a new report (Reporter app)
router.post('/', upload.single('photo'), createReport);

// 🚨 THE TWO NEW DOORS FOR THE NGO APP
router.get('/', getAllReports); 
router.put('/:id/status', updateReportStatus); 

module.exports = router;