const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Report = require('./models/Report');

dotenv.config();

// Standard coordinates for a localized demo
const BASE_LAT = 12.8230; 
const BASE_LNG = 80.0450;

const mockReports = [
    {
        animalType: "Dog",
        description: "Severe bleeding, hit by a speeding car on the main road. Needs immediate surgery.",
        location: { lat: BASE_LAT + 0.001, lng: BASE_LNG + 0.002 },
        status: "Pending",
        priority: 10,
        aiSummary: "AI Assessment: CRITICAL. High probability of internal trauma and active hemorrhage."
    },
    {
        animalType: "Cat",
        description: "Trapped in a deep drainage pipe. Meowing loudly, looks dehydrated.",
        location: { lat: BASE_LAT - 0.002, lng: BASE_LNG + 0.001 },
        status: "Pending",
        priority: 7,
        aiSummary: "AI Assessment: URGENT. Potential respiratory distress due to confined space."
    },
    {
        animalType: "Cow",
        description: "Limping near the market area. Seems to have a plastic ingestion issue or leg injury.",
        location: { lat: BASE_LAT + 0.003, lng: BASE_LNG - 0.001 },
        status: "Pending",
        priority: 5,
        aiSummary: "AI Assessment: STANDARD. Non-life-threatening mobility issue detected."
    },
    {
        animalType: "Bird",
        description: "Small sparrow with a broken wing found on a balcony.",
        location: { lat: BASE_LAT - 0.001, lng: BASE_LNG - 0.002 },
        status: "Pending",
        priority: 3,
        aiSummary: "AI Assessment: LOW PRIORITY. Stable condition, requires basic wing splinting."
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("📡 Connected to MongoDB for seeding...");
        
        // Clear existing pending reports to avoid clutter
        await Report.deleteMany({ status: "Pending" });
        console.log("🧹 Cleared old pending reports.");

        await Report.insertMany(mockReports);
        console.log("✅ Mock data inserted successfully!");
        
        process.exit();
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDB();