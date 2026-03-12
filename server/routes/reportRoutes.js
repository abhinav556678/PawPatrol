const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer'); // 👈 Import multer middleware
const { protect } = require('../middleware/authMiddleware'); // 👈 Import your middleware
const { 
  createReport, 
  getAllReports, 
  updateReportStatus, 
  chatFirstAid 
} = require('../controllers/reportController');

// 🛡️ Apply 'protect' to the POST routes
router.post('/', protect, upload.single('photo'), createReport); 
router.post('/chat', protect, chatFirstAid);

// 🌍 Keep GET public so people can see the impact feed
router.get('/', getAllReports);

module.exports = router;