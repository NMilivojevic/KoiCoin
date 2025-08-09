import { Router, Request, Response } from 'express';
import { query } from '../utils/database';
import { authenticateToken } from '../middleware/auth';
import { type Currency } from '../utils/currency';
import { exchangeRateService } from '../services/exchangeRate';

const router = Router();

// Get current user's profile information
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const result = await query('SELECT id, username, name, currency FROM users WHERE id = $1', [userId]);
    
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
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's current currency preference
router.get('/currency', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const result = await query('SELECT currency FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currency = result.rows[0].currency;
    
    res.json({ currency });
  } catch (error) {
    console.error('Get currency error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user's currency preference
router.put('/currency', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { currency }: { currency: Currency } = req.body;
    
    // Validate currency
    if (!currency || !['RSD', 'EUR', 'USD'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency. Must be RSD, EUR, or USD' });
    }
    
    // Update user's currency preference
    await query('UPDATE users SET currency = $1 WHERE id = $2', [currency, userId]);
    
    res.json({ 
      message: 'Currency updated successfully',
      currency 
    });
  } catch (error) {
    console.error('Update currency error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current exchange rates
router.get('/exchange-rates', authenticateToken, async (req: Request, res: Response) => {
  try {
    const rates = await exchangeRateService.getExchangeRates();
    
    res.json({ 
      base: 'RSD',
      rates,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;