const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    phoneNumber: { 
        type: String, 
        required: true, 
        unique: true // This acts as their login username
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        // 🚨 ADDED 'Clinic' TO THE ENUM LIST:
        enum: ['Reporter', 'NGO', 'Clinic'], 
        required: true 
    },
    // 🚨 NEW FIELD: Store the name of the NGO or Clinic
    organizationName: { 
        type: String, 
        default: '' 
    },
    // This is the GeoJSON format required for Leaflet map routing
    baseLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    }
}, { timestamps: true });

// This index makes it super fast for MongoDB to calculate map distances
userSchema.index({ baseLocation: '2dsphere' }); 

module.exports = mongoose.model('User', userSchema);