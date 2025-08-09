"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const exchangeRate_1 = require("../services/exchangeRate");
const router = (0, express_1.Router)();
// Get current user's profile information
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await (0, database_1.query)('SELECT id, username, name, currency FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        res.json({
            id: user.id,
            username: user.username,
            name: user.name,
            currency: user.currency
        });
    }
    catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get user's current currency preference
router.get('/currency', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await (0, database_1.query)('SELECT currency FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const currency = result.rows[0].currency;
        res.json({ currency });
    }
    catch (error) {
        console.error('Get currency error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update user's currency preference
router.put('/currency', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currency } = req.body;
        // Validate currency
        if (!currency || !['RSD', 'EUR', 'USD'].includes(currency)) {
            return res.status(400).json({ error: 'Invalid currency. Must be RSD, EUR, or USD' });
        }
        // Update user's currency preference
        await (0, database_1.query)('UPDATE users SET currency = $1 WHERE id = $2', [currency, userId]);
        res.json({
            message: 'Currency updated successfully',
            currency
        });
    }
    catch (error) {
        console.error('Update currency error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get current exchange rates
router.get('/exchange-rates', auth_1.authenticateToken, async (req, res) => {
    try {
        const rates = await exchangeRate_1.exchangeRateService.getExchangeRates();
        res.json({
            base: 'RSD',
            rates,
            lastUpdated: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get exchange rates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map