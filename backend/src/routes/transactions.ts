import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { query } from '../utils/database';
import { CreateTransactionRequest, UpdateTransactionRequest, Transaction } from '../models/types';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all transactions for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      type,
      account_id,
      category,
      start_date,
      end_date,
      limit = '50',
      offset = '0',
      sort = 'date',
      order = 'desc'
    } = req.query;

    let queryStr = `
      SELECT t.*, a.name as account_name, a.type as account_type
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = $1
    `;
    const params: any[] = [userId];
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
    const sortField = validSortFields.includes(sort as string) ? sort as string : 'date';
    const sortOrder = validOrder.includes(order as string) ? order as string : 'desc';
    
    queryStr += ` ORDER BY t.${sortField} ${sortOrder.toUpperCase()}`;

    // Add pagination
    queryStr += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(queryStr, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM transactions WHERE user_id = $1`;
    const countParams: any[] = [userId];
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

    const countResult = await query(countQuery, countParams);
    const total = countResult.rows[0].total;

    res.json({
      transactions: result.rows,
      pagination: {
        total: parseInt(total),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(offset as string) + parseInt(limit as string) < parseInt(total)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const result = await query(
      `SELECT t.*, a.name as account_name, a.type as account_type
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new transaction
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { account_id, amount, description, category, type, currency, date }: CreateTransactionRequest = req.body;

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
    const accountResult = await query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [account_id, userId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Use a database transaction to ensure balance consistency
    await query('BEGIN TRANSACTION');
    
    try {
      // Create transaction
      const transactionDate = date ? new Date(date) : new Date();
      const dateString = transactionDate.toISOString().split('T')[0]; // Store as YYYY-MM-DD
      
      console.log('Creating transaction with date:', {
        originalDate: date,
        transactionDate: transactionDate,
        dateString: dateString,
        type,
        amount
      });
      
      const result = await query(
        `INSERT INTO transactions (user_id, account_id, amount, description, category, type, currency, date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, account_id, amount, description, category, type, currency, dateString]
      );
      
      console.log('Created transaction:', result.rows[0]);

      // Update account balance
      const balanceChange = type === 'income' ? amount : -amount;
      await query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [balanceChange, account_id]
      );

      await query('COMMIT');
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update transaction
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { account_id, amount, description, category, type, currency, date }: UpdateTransactionRequest = req.body;

    // Check if transaction exists and belongs to user
    const existingResult = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

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
      const accountResult = await query(
        'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
        [account_id, userId]
      );

      if (accountResult.rows.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
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
      const dateString = new Date(date).toISOString().split('T')[0];
      updateValues.push(dateString);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Use database transaction for balance consistency
    await query('BEGIN TRANSACTION');
    
    try {
      updateValues.push(id, userId);
      const result = await query(
        `UPDATE transactions SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
         RETURNING *`,
        updateValues
      );

      // Update account balances if amount, type, or account_id changed
      const oldTransaction = existingResult.rows[0];
      const updatedTransaction = result.rows[0];

      // Revert old transaction's effect on balance
      const oldBalanceChange = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
      await query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [oldBalanceChange, oldTransaction.account_id]
      );

      // Apply new transaction's effect on balance
      const newBalanceChange = updatedTransaction.type === 'income' ? updatedTransaction.amount : -updatedTransaction.amount;
      await query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [newBalanceChange, updatedTransaction.account_id]
      );

      await query('COMMIT');
      
      res.json(result.rows[0]);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transaction
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Check if transaction exists and belongs to user
    const existingResult = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Use database transaction for deletion consistency
    await query('BEGIN TRANSACTION');
    
    try {
      // Archive transaction before deletion
      const transaction = existingResult.rows[0];
      await query(
        `INSERT INTO archived_transactions 
         (original_id, user_id, account_id, amount, description, category, type, currency, date, archived_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
        [
          transaction.id,
          transaction.user_id,
          transaction.account_id,
          transaction.amount,
          transaction.description,
          transaction.category,
          transaction.type,
          transaction.currency,
          transaction.date
        ]
      );

      // Revert transaction's effect on account balance
      const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      await query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [balanceChange, transaction.account_id]
      );

      // Delete transaction
      await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);

      await query('COMMIT');
      
      res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction statistics
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { period = 'month', currency = 'RSD' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = "AND DATE(t.date) = DATE('now', 'localtime')";
        break;
      case 'week':
        dateFilter = "AND t.date >= DATE('now', 'localtime', '-7 days')";
        break;
      case 'month':
        dateFilter = "AND t.date >= DATE('now', 'localtime', 'start of month')";
        break;
      case 'year':
        dateFilter = "AND t.date >= DATE('now', 'localtime', 'start of year')";
        break;
    }

    // Get income and expense totals
    const statsResult = await query(
      `SELECT 
        t.type,
        t.currency,
        SUM(t.amount) as total,
        COUNT(*) as count
       FROM transactions t
       WHERE t.user_id = $1 ${dateFilter}
       GROUP BY t.type, t.currency
       ORDER BY t.type, t.currency`,
      [userId]
    );

    // Get account balances
    const balanceResult = await query(
      `SELECT 
        a.currency,
        SUM(a.balance) as total_balance
       FROM accounts a
       WHERE a.user_id = $1
       GROUP BY a.currency`,
      [userId]
    );

    console.log(`Stats query for user ${userId}, period ${period}:`, {
      dateFilter,
      query: `SELECT t.type, t.currency, SUM(t.amount) as total, COUNT(*) as count FROM transactions t WHERE t.user_id = $1 ${dateFilter} GROUP BY t.type, t.currency ORDER BY t.type, t.currency`,
      statsRows: statsResult.rows,
      balanceRows: balanceResult.rows
    });

    res.json({
      period,
      transactions: statsResult.rows,
      account_balances: balanceResult.rows
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to check transaction data
router.get('/debug/all', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await query(
      `SELECT *, 
       DATE(date) as date_only,
       DATE('now') as current_date,
       DATE('now', '-7 days') as week_ago,
       DATE('now', 'start of month') as month_start
       FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      transactions: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching debug transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;