"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../utils/database");
const router = (0, express_1.Router)();
// Apply authentication to all routes
router.use(auth_1.authenticateToken);
// Get all transactions for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, account_id, category, start_date, end_date, limit = '50', offset = '0', sort = 'date', order = 'desc' } = req.query;
        let queryStr = `
      SELECT t.*, a.name as account_name, a.type as account_type
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = $1
    `;
        const params = [userId];
        let paramIndex = 2;
        // Add filters
        if (type && (type === 'income' || type === 'expense')) {
            queryStr += ` AND t.type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        if (account_id) {
            queryStr += ` AND t.account_id = $${paramIndex}`;
            params.push(account_id);
            paramIndex++;
        }
        if (category) {
            queryStr += ` AND t.category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        if (start_date) {
            queryStr += ` AND t.date >= $${paramIndex}`;
            params.push(start_date);
            paramIndex++;
        }
        if (end_date) {
            queryStr += ` AND t.date <= $${paramIndex}`;
            params.push(end_date);
            paramIndex++;
        }
        // Add sorting
        const validSortFields = ['date', 'amount', 'created_at'];
        const validOrder = ['asc', 'desc'];
        const sortField = validSortFields.includes(sort) ? sort : 'date';
        const sortOrder = validOrder.includes(order) ? order : 'desc';
        queryStr += ` ORDER BY t.${sortField} ${sortOrder.toUpperCase()}`;
        // Add pagination
        queryStr += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        const result = await (0, database_1.query)(queryStr, params);
        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM transactions WHERE user_id = $1`;
        const countParams = [userId];
        let countParamIndex = 2;
        if (type && (type === 'income' || type === 'expense')) {
            countQuery += ` AND type = $${countParamIndex}`;
            countParams.push(type);
            countParamIndex++;
        }
        if (account_id) {
            countQuery += ` AND account_id = $${countParamIndex}`;
            countParams.push(account_id);
            countParamIndex++;
        }
        if (category) {
            countQuery += ` AND category = $${countParamIndex}`;
            countParams.push(category);
            countParamIndex++;
        }
        if (start_date) {
            countQuery += ` AND date >= $${countParamIndex}`;
            countParams.push(start_date);
            countParamIndex++;
        }
        if (end_date) {
            countQuery += ` AND date <= $${countParamIndex}`;
            countParams.push(end_date);
            countParamIndex++;
        }
        const countResult = await (0, database_1.query)(countQuery, countParams);
        const total = countResult.rows[0].total;
        res.json({
            transactions: result.rows,
            pagination: {
                total: parseInt(total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: parseInt(offset) + parseInt(limit) < parseInt(total)
            }
        });
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await (0, database_1.query)(`SELECT t.*, a.name as account_name, a.type as account_type
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = $1 AND t.user_id = $2`, [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create new transaction
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { account_id, amount, description, category, type, currency, date } = req.body;
        // Validate required fields
        if (!account_id || amount === undefined || !type || !currency) {
            return res.status(400).json({ error: 'Missing required fields: account_id, amount, type, currency' });
        }
        // Validate type
        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: 'Invalid transaction type. Must be "income" or "expense"' });
        }
        // Validate currency
        if (!['RSD', 'EUR', 'USD', 'HUF'].includes(currency)) {
            return res.status(400).json({ error: 'Invalid currency. Must be one of: RSD, EUR, USD, HUF' });
        }
        // Check if account belongs to user
        const accountResult = await (0, database_1.query)('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [account_id, userId]);
        if (accountResult.rows.length === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }
        // Create transaction
        const transactionDate = date ? new Date(date) : new Date();
        const result = await (0, database_1.query)(`INSERT INTO transactions (user_id, account_id, amount, description, category, type, currency, date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING *`, [userId, account_id, amount, description, category, type, currency, transactionDate]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update transaction
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { account_id, amount, description, category, type, currency, date } = req.body;
        // Check if transaction exists and belongs to user
        const existingResult = await (0, database_1.query)('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        // Validate fields if provided
        if (type && !['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: 'Invalid transaction type. Must be "income" or "expense"' });
        }
        if (currency && !['RSD', 'EUR', 'USD', 'HUF'].includes(currency)) {
            return res.status(400).json({ error: 'Invalid currency. Must be one of: RSD, EUR, USD, HUF' });
        }
        // Check if new account belongs to user (if account_id is being updated)
        if (account_id) {
            const accountResult = await (0, database_1.query)('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [account_id, userId]);
            if (accountResult.rows.length === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }
        }
        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        if (account_id !== undefined) {
            updateFields.push(`account_id = $${paramIndex}`);
            updateValues.push(account_id);
            paramIndex++;
        }
        if (amount !== undefined) {
            updateFields.push(`amount = $${paramIndex}`);
            updateValues.push(amount);
            paramIndex++;
        }
        if (description !== undefined) {
            updateFields.push(`description = $${paramIndex}`);
            updateValues.push(description);
            paramIndex++;
        }
        if (category !== undefined) {
            updateFields.push(`category = $${paramIndex}`);
            updateValues.push(category);
            paramIndex++;
        }
        if (type !== undefined) {
            updateFields.push(`type = $${paramIndex}`);
            updateValues.push(type);
            paramIndex++;
        }
        if (currency !== undefined) {
            updateFields.push(`currency = $${paramIndex}`);
            updateValues.push(currency);
            paramIndex++;
        }
        if (date !== undefined) {
            updateFields.push(`date = $${paramIndex}`);
            updateValues.push(new Date(date));
            paramIndex++;
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        updateValues.push(id, userId);
        const result = await (0, database_1.query)(`UPDATE transactions SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`, updateValues);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete transaction
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Check if transaction exists and belongs to user
        const existingResult = await (0, database_1.query)('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        // Archive transaction before deletion
        const transaction = existingResult.rows[0];
        await (0, database_1.query)(`INSERT INTO archived_transactions 
       (original_id, user_id, account_id, amount, description, category, type, currency, date, archived_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`, [
            transaction.id,
            transaction.user_id,
            transaction.account_id,
            transaction.amount,
            transaction.description,
            transaction.category,
            transaction.type,
            transaction.currency,
            transaction.date
        ]);
        // Delete transaction
        await (0, database_1.query)('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
        res.json({ message: 'Transaction deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get transaction statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = 'month', currency = 'RSD' } = req.query;
        let dateFilter = '';
        switch (period) {
            case 'today':
                dateFilter = "AND DATE(t.date) = DATE('now')";
                break;
            case 'week':
                dateFilter = "AND t.date >= DATE('now', '-7 days')";
                break;
            case 'month':
                dateFilter = "AND t.date >= DATE('now', 'start of month')";
                break;
            case 'year':
                dateFilter = "AND t.date >= DATE('now', 'start of year')";
                break;
        }
        // Get income and expense totals
        const statsResult = await (0, database_1.query)(`SELECT 
        t.type,
        t.currency,
        SUM(t.amount) as total,
        COUNT(*) as count
       FROM transactions t
       WHERE t.user_id = $1 ${dateFilter}
       GROUP BY t.type, t.currency
       ORDER BY t.type, t.currency`, [userId]);
        // Get account balances
        const balanceResult = await (0, database_1.query)(`SELECT 
        a.currency,
        SUM(a.balance) as total_balance
       FROM accounts a
       WHERE a.user_id = $1
       GROUP BY a.currency`, [userId]);
        res.json({
            period,
            transactions: statsResult.rows,
            account_balances: balanceResult.rows
        });
    }
    catch (error) {
        console.error('Error fetching transaction stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map