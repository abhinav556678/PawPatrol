const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const reportController = require('../controllers/reportController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage });

// 1. Create a new report (Reporter app)
router.post('/', upload.single('photo'), reportController.createReport);

// 2. Fetch all reports (NGO Dashboard)
router.get('/', reportController.getAllReports); 

// 3. Update report status (NGO Dashboard)
// Changed from '/:id/status' to '/:id' to match the Controller we just wrote
router.patch('/:id', reportController.updateReportStatus); 

module.exports = router;