const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Driver = require('./models/Driver');

// Load environment variables (like your MongoDB URI)
dotenv.config();

const seedDatabase = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        
        // 1. Clear out any old dummy data so we don't get duplicate errors
        await User.deleteMany({ role: { $in: ['NGO', 'Clinic'] } });
        await Driver.deleteMany();

        // 2. Create a Dummy NGO Account
        const ngo = await User.create({
            name: 'Paws & Claws Rescue',
            phoneNumber: '0000000000', // NGO Login ID
            password: 'password123',   // NGO Password
            role: 'NGO',
            organizationName: 'Paws & Claws',
            // Starting coordinates roughly around SRM area [longitude, latitude]
            baseLocation: { type: 'Point', coordinates: [80.0450, 12.8230] } 
        });

        // 3. Create two dummy drivers hired by this NGO
        await Driver.create([
            { 
                name: 'Ramesh (Ambulance 1)', 
                phone: '9998887771', 
                organizationId: ngo._id, 
                status: 'Free', 
                currentLocation: { lat: 12.8235, lng: 80.0455 } 
            },
            { 
                name: 'Suresh (Ambulance 2)', 
                phone: '9998887772', 
                organizationId: ngo._id, 
                status: 'Free', 
                currentLocation: { lat: 12.8220, lng: 80.0440 } 
            }
        ]);

        console.log('✅ Success! Dummy NGO and Drivers have been seeded.');
        process.exit(); // Close the script
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedDatabase();