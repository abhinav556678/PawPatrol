const Report = require('../models/Report');

exports.createReport = async (req, res) => {
    try {
        const { animalType, description, location } = req.body;
        
        // Parse the location string back into an object { lat, lng }
        const parsedLocation = JSON.parse(location);

        // If Multer caught a file, save the path, otherwise leave it blank
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

        // Create the new report in MongoDB
        const newReport = await Report.create({
            animalType,
            description,
            location: parsedLocation,
            photoUrl
        });

        res.status(201).json({ message: 'Rescue report dispatched!', report: newReport });
    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ message: 'Failed to dispatch report', error: error.message });
    }
};