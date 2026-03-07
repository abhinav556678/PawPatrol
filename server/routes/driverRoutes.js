const express = require('express');
const router = express.Router();
const { getDrivers } = require('../controllers/driverController');

router.get('/', getDrivers); // This creates the GET /api/drivers door

module.exports = router;