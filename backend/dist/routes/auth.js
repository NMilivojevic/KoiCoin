"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../utils/database");
const router = (0, express_1.Router)();
// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, name, password } = req.body;
        if (!username || !name || !password) {
            return res.status(400).json({ error: 'Username, name, and password are required' });
        }
        // Check if user already exists
        const existingUser = await (0, database_1.query)('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this username already exists' });
        }
        // Hash password
        const saltRounds = 10;
        const password_hash = await bcryptjs_1.default.hash(password, saltRounds);
        // Create user
        const result = await (0, database_1.query)('INSERT INTO users (username, name, password_hash) VALUES ($1, $2, $3) RETURNING id, username, name, currency, created_at', [username, name, password_hash]);
        const user = result.rows[0];
        // Create default account
        await (0, database_1.query)('INSERT INTO accounts (user_id, name, type, balance) VALUES ($1, $2, $3, $4)', [user.id, 'Main Account', 'checking', 0.00]);
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, name: user.name, currency: user.currency }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'User created successfully',
            user: { id: user.id, username: user.username, name: user.name, currency: user.currency },
            token
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        // Find user
        const result = await (0, database_1.query)('SELECT id, username, name, password_hash, currency FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, name: user.name, currency: user.currency }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Login successful',
            user: { id: user.id, username: user.username, name: user.name, currency: user.currency },
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map