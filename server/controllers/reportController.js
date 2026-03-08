const Report = require('../models/Report');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// 1. Create Report with Sightengine + Imagga AI
exports.createReport = async (req, res) => {
    try {
        const { animalType, description, location } = req.body;
        const parsedLocation = JSON.parse(location);
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

        let aiPriority = 5;
        let aiAnalysis = "Awaiting AI verification...";

        if (req.file) {
            const imagePath = req.file.path;

            // 🩸 SIGHTENGINE (Injury Detection)
            const sightData = new FormData();
            sightData.append('media', fs.createReadStream(imagePath));
            sightData.append('models', 'gore');
            sightData.append('api_user', process.env.SIGHTENGINE_USER);
            sightData.append('api_secret', process.env.SIGHTENGINE_SECRET);

            const sightRes = await axios.post('https://api.sightengine.com/1.0/check.json', sightData, {
                headers: sightData.getHeaders()
            });

            const goreScore = sightRes.data.gore.prob;
            
            if (goreScore > 0.4) {
                aiPriority = 10;
                aiAnalysis = `🚨 CRITICAL: Injury detected (${(goreScore * 100).toFixed(0)}% confidence).`;
            } else {
                aiPriority = 7;
                aiAnalysis = `✅ STABLE: Animal appears physically fine.`;
            }
        }

        const newReport = await Report.create({
            animalType, description, location: parsedLocation, photoUrl,
            status: 'Pending', priority: aiPriority, aiSummary: aiAnalysis
        });

        res.status(201).json({ message: 'AI Analysis Complete!', report: newReport });
    } catch (error) {
        console.error("AI Error:", error.message);
        res.status(500).json({ message: 'AI Analysis failed' });
    }
};

// 2. Get all reports (Missing this was causing the crash!)
exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.find({ status: { $ne: 'Resolved' } })
                                    .sort({ priority: -1, createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch reports' });
    }
};

// 3. Update report status
exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedReport = await Report.findByIdAndUpdate(id, { status }, { new: true });
        res.status(200).json(updatedReport);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update status' });
    }
};