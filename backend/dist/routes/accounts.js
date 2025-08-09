"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticateToken);
// GET /api/accounts - Get all accounts for the authenticated user
router.get("/", async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await (0, database_1.query)("SELECT id, user_id, name, type, currency, balance, created_at FROM accounts WHERE user_id = ? ORDER BY created_at DESC", [userId]);
        const accounts = result.rows.map((row) => ({
            id: row.id,
            user_id: row.user_id,
            name: row.name,
            type: row.type,
            currency: row.currency,
            balance: parseFloat(row.balance) || 0,
            created_at: new Date(row.created_at),
        }));
        res.json(accounts);
    }
    catch (error) {
        console.error("Error fetching accounts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /api/accounts - Create a new account
router.post("/", async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, type, currency, balance = 0, } = req.body;
        // Validate required fields
        if (!name || !type || !currency) {
            return res.status(400).json({
                error: "Name, type, and currency are required",
            });
        }
        // Validate type
        if (!["Cash", "Bank Account", "Crypto Wallet"].includes(type)) {
            return res.status(400).json({
                error: 'Account type must be either "Cash", "Crypto Wallet", or "Bank Account"',
            });
        }
        // Validate currency
        if (!["RSD", "EUR", "USD"].includes(currency)) {
            return res.status(400).json({
                error: "Currency must be RSD, EUR, or USD",
            });
        }
        const insertResult = await (0, database_1.query)("INSERT INTO accounts (user_id, name, type, currency, balance) VALUES (?, ?, ?, ?, ?)", [userId, name, type, currency, balance]);
        if (insertResult.rowCount === 0) {
            return res.status(500).json({ error: "Failed to create account" });
        }
        // Get the created account
        const result = await (0, database_1.query)("SELECT id, user_id, name, type, currency, balance, created_at FROM accounts WHERE rowid = last_insert_rowid()");
        if (result.rows.length === 0) {
            return res
                .status(500)
                .json({ error: "Failed to retrieve created account" });
        }
        const newAccount = {
            id: result.rows[0].id,
            user_id: result.rows[0].user_id,
            name: result.rows[0].name,
            type: result.rows[0].type,
            currency: result.rows[0].currency,
            balance: parseFloat(result.rows[0].balance) || 0,
            created_at: new Date(result.rows[0].created_at),
        };
        res.status(201).json(newAccount);
    }
    catch (error) {
        console.error("Error creating account:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PUT /api/accounts/:id - Update an existing account
router.put("/:id", async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = parseInt(req.params.id);
        const updateData = req.body;
        if (isNaN(accountId)) {
            return res.status(400).json({ error: "Invalid account ID" });
        }
        // Check if account exists and belongs to user
        const existingAccount = await (0, database_1.query)("SELECT id FROM accounts WHERE id = ? AND user_id = ?", [accountId, userId]);
        if (existingAccount.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }
        // Validate type if provided
        if (updateData.type &&
            !["Cash", "Bank Account", "Crypto Wallet"].includes(updateData.type)) {
            return res.status(400).json({
                error: 'Account type must be either "Cash", "Crypto Wallet", or "Bank Account"',
            });
        }
        // Validate currency if provided
        if (updateData.currency &&
            !["RSD", "EUR", "USD"].includes(updateData.currency)) {
            return res.status(400).json({
                error: "Currency must be RSD, EUR, or USD",
            });
        }
        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        if (updateData.name !== undefined) {
            updateFields.push("name = ?");
            updateValues.push(updateData.name);
        }
        if (updateData.type !== undefined) {
            updateFields.push("type = ?");
            updateValues.push(updateData.type);
        }
        if (updateData.currency !== undefined) {
            updateFields.push("currency = ?");
            updateValues.push(updateData.currency);
        }
        if (updateData.balance !== undefined) {
            updateFields.push("balance = ?");
            updateValues.push(updateData.balance);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }
        updateValues.push(accountId);
        const updateQuery = `UPDATE accounts SET ${updateFields.join(", ")} WHERE id = ?`;
        const updateResult = await (0, database_1.query)(updateQuery, updateValues);
        if (updateResult.rowCount === 0) {
            return res.status(500).json({ error: "Failed to update account" });
        }
        // Get the updated account
        const result = await (0, database_1.query)("SELECT id, user_id, name, type, currency, balance, created_at FROM accounts WHERE id = ?", [accountId]);
        if (result.rows.length === 0) {
            return res
                .status(500)
                .json({ error: "Failed to retrieve updated account" });
        }
        const updatedAccount = {
            id: result.rows[0].id,
            user_id: result.rows[0].user_id,
            name: result.rows[0].name,
            type: result.rows[0].type,
            currency: result.rows[0].currency,
            balance: parseFloat(result.rows[0].balance) || 0,
            created_at: new Date(result.rows[0].created_at),
        };
        res.json(updatedAccount);
    }
    catch (error) {
        console.error("Error updating account:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// DELETE /api/accounts/:id - Delete an account
router.delete("/:id", async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = parseInt(req.params.id);
        if (isNaN(accountId)) {
            return res.status(400).json({ error: "Invalid account ID" });
        }
        // Check if account exists and belongs to user
        const existingAccount = await (0, database_1.query)("SELECT id FROM accounts WHERE id = ? AND user_id = ?", [accountId, userId]);
        if (existingAccount.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }
        // Check if account has transactions
        const transactionCount = await (0, database_1.query)("SELECT COUNT(*) as count FROM transactions WHERE account_id = ?", [accountId]);
        if (transactionCount.rows[0].count > 0) {
            return res.status(409).json({
                error: "Cannot delete account that has transactions. Please delete all transactions first.",
            });
        }
        // Delete the account
        const result = await (0, database_1.query)("DELETE FROM accounts WHERE id = ? AND user_id = ?", [accountId, userId]);
        if (result.rowCount === 0) {
            return res.status(500).json({ error: "Failed to delete account" });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=accounts.js.map