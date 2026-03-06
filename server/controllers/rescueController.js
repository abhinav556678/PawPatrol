const RescueReport = require('../models/RescueReport');
const User = require('../models/User');

// @desc    Create a new rescue report (Used by Reporter)
exports.createReport = async (req, res) => {
    try {
        const { animalType, description, coordinates } = req.body;
        
        const report = await RescueReport.create({
            reporter: req.user.id, 
            animalType,
            description,
            location: {
                type: 'Point',
                coordinates // [longitude, latitude]
            },
            checkpoints: [{ status: 'Pending', note: 'Report submitted' }]
        });

        // 📢 REAL-TIME BROADCAST: Alert nearby NGOs like your friend
        const io = req.app.get('io');
        io.emit('newRescueReport', {
            id: report._id,
            animalType,
            description,
            coordinates,
            reporterId: req.user.id
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    NGO Radar: Find clinics near a specific point
exports.getNearbyClinics = async (req, res) => {
    try {
        const { lng, lat } = req.query;

        const nearby = await User.find({
            role: 'NGO',
            baseLocation: {
                $near: {
                    $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: 10000 // 10km radius
                }
            }
        }).select('name phoneNumber baseLocation');

        res.json(nearby);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept/Update Status with Live Socket Tracking
exports.updateReportStatus = async (req, res) => {
    try {
        const { status, note, coordinates } = req.body; // coordinates passed if NGO is moving
        const report = await RescueReport.findById(req.params.id);

        if (!report) return res.status(404).json({ message: 'Report not found' });

        report.status = status;
        report.checkpoints.push({ status, note });

        if (status === 'Accepted' && !report.assignedNGO) {
            report.assignedNGO = req.user.id;
        }

        await report.save();

        // 📡 LIVE UPDATE: Push status/location change to the Reporter's screen
        const io = req.app.get('io');
        
        // Update the timeline checkpoints
        io.to(req.params.id).emit('receiveStatusUpdate', status);
        
        // If the NGO is moving, push their GPS to the Reporter's map
        if (coordinates) {
            io.to(req.params.id).emit('receiveLocationUpdate', coordinates);
        }

        // 🏆 REWARD SYSTEM: Add points if resolved
        if (status === 'Resolved') {
            await User.findByIdAndUpdate(report.reporter, { $inc: { points: 50 } });
        }

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all pending reports for the NGO feed
exports.getPendingReports = async (req, res) => {
    try {
        const reports = await RescueReport.find({ status: 'Pending' })
            .populate('reporter', 'name phoneNumber');
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};