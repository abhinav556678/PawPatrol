const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    animalType: { type: String, required: true },
    description: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    photoUrl: { type: String },
    status: { 
        type: String, 
        default: 'Pending', 
        enum: ['Pending', 'Dispatched', 'Arrived', 'Resolved'] 
    },
    // 🚨 NEW AI FIELDS
    priority: { 
        type: Number, 
        default: 5 // AI will overwrite this between 1-10
    },
    aiSummary: { 
        type: String // Stores the "HIGH URGENCY" or "Standard" notes
    },
    followUpReport: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);