const Report = require('../models/Report');

// 1. Updated: Create report with a default "Pending" status
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
            photoUrl,
            status: 'Pending' // 🚨 This is key for your NGO feed to see it!
        });

        res.status(201).json({ message: 'Rescue report dispatched!', report: newReport });
    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ message: 'Failed to dispatch report', error: error.message });
    }
};

// 2. 🚨 NEW: Fetch active reports for the NGO Dashboard
exports.getAllReports = async (req, res) => {
    try {
        // Fetch reports that aren't resolved yet, newest first
        const reports = await Report.find({ status: { $ne: 'Resolved' } }).sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
    }
};

// 3. 🚨 NEW: Update report status (e.g., Pending -> Dispatched)
exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const updatedReport = await Report.findByIdAndUpdate(
            id, 
            { status: status }, 
            { new: true } 
        );

        res.status(200).json({ message: 'Status updated!', report: updatedReport });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: 'Failed to update status', error: error.message });
    }
};