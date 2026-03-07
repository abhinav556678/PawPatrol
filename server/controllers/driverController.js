const Driver = require('../models/Driver');

exports.getDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find(); // Fetches all drivers from MongoDB
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch drivers', error: error.message });
    }
};