const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        required: true 
    },
    // This links the driver to the specific NGO or Clinic that hired them
    organizationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Free', 'Busy'], 
        default: 'Free' 
    },
    // We will update these coordinates live via Socket.io later
    currentLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);