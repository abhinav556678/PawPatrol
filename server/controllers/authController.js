const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user (Reporter or NGO)
exports.registerUser = async (req, res) => {
    try {
        const { name, phoneNumber, password, role } = req.body;

        // 1. Check if user already exists
        const userExists = await User.findOne({ phoneNumber });
        if (userExists) return res.status(400).json({ message: 'Phone number already registered' });

        // 2. Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create the user in MongoDB
        const user = await User.create({
            name,
            phoneNumber,
            password: hashedPassword,
            role
        });

        // 4. Generate a JWT Token to keep them logged in
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({ _id: user._id, name: user.name, role: user.role, token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login existing user
exports.loginUser = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        // 1. Find the user by phone number
        const user = await User.findOne({ phoneNumber });

        // 2. Check if user exists AND password matches
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.json({ _id: user._id, name: user.name, role: user.role, token });
        } else {
            res.status(401).json({ message: 'Invalid phone number or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};