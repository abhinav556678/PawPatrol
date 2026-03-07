const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    animalType: { type: String, required: true },
    description: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    photoUrl: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'Dispatched', 'Resolved'], default: 'Pending' },
    
    // 🚨 NEW: This tracks which driver is currently on their way
    assignedDriver: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Driver', 
        default: null 
    },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);