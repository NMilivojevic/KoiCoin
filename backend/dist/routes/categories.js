"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../utils/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all categories for a user (with optional type filter)
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.query;
        let queryText = 'SELECT * FROM categories WHERE user_id = ?';
        const queryParams = [userId];
        if (type && (type === 'expense' || type === 'income')) {
            queryText += ' AND type = ?';
            queryParams.push(type);
        }
        queryText += ' ORDER BY created_at DESC';
        const result = await (0, database_1.query)(queryText, queryParams);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Create a new category
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, type } = req.body;
        // Validate required fields
        if (!name || !type) {
            return res.status(400).json({ message: 'Name and type are required' });
        }
        if (type !== 'expense' && type !== 'income') {
            return res.status(400).json({ message: 'Type must be either "expense" or "income"' });
        }
        // Check if category name already exists for this user and type
        const existingCategory = await (0, database_1.query)('SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ?', [userId, name, type]);
        if (existingCategory.rows.length > 0) {
            return res.status(400).json({ message: 'Category name already exists for this type' });
        }
        const result = await (0, database_1.query)('INSERT INTO categories (user_id, name, description, type) VALUES (?, ?, ?, ?) RETURNING *', [userId, name, description || null, type]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Update a category
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const categoryId = parseInt(req.params.id);
        const { name, description } = req.body;
        if (!categoryId || isNaN(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }
        // Check if category exists and belongs to user
        const existingCategory = await (0, database_1.query)('SELECT * FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
        if (existingCategory.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        // If name is being updated, check for duplicates
        if (name) {
            const duplicateCategory = await (0, database_1.query)('SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ? AND id != ?', [userId, name, existingCategory.rows[0].type, categoryId]);
            if (duplicateCategory.rows.length > 0) {
                return res.status(400).json({ message: 'Category name already exists for this type' });
            }
        }
        // Build update query dynamically
        const updates = [];
        const values = [];
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }
        values.push(categoryId, userId);
        const updateQuery = `UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
        const result = await (0, database_1.query)(updateQuery, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        // Fetch the updated category
        const updatedCategory = await (0, database_1.query)('SELECT * FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
        res.json(updatedCategory.rows[0]);
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Delete a category
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const categoryId = parseInt(req.params.id);
        if (!categoryId || isNaN(categoryId)) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }
        // Check if category exists and belongs to user
        const existingCategory = await (0, database_1.query)('SELECT * FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
        if (existingCategory.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        // Check if category is being used in transactions
        const transactionsUsingCategory = await (0, database_1.query)('SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND category = ?', [userId, existingCategory.rows[0].name]);
        if (transactionsUsingCategory.rows[0].count > 0) {
            return res.status(400).json({
                message: 'Cannot delete category that is being used in transactions'
            });
        }
        await (0, database_1.query)('DELETE FROM categories WHERE id = ? AND user_id = ?', [categoryId, userId]);
        res.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map