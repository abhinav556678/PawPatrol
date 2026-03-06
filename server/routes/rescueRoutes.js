const express = require('express');
const router = express.Router();
const { 
    createReport, 
    getPendingReports, 
    updateReportStatus, 
    getNearbyClinics // <-- Make sure this is also imported at the top!
} = require('../controllers/rescueController');
const { protect } = require('../middleware/authMiddleware');

// Existing Routes
router.post('/create', protect, createReport);
router.get('/pending', protect, getPendingReports);
router.put('/:id/update', protect, updateReportStatus);

// 🆕 ADD THIS NEW LINE HERE:
router.get('/nearby-clinics', protect, getNearbyClinics);

module.exports = router;