"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const database_1 = require("./database");
const initializeDatabase = async () => {
    try {
        // Create users table
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        currency VARCHAR(3) DEFAULT 'RSD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Add currency column if it doesn't exist (for existing databases)
        try {
            // Check if currency column exists
            const tableInfo = await (0, database_1.query)(`PRAGMA table_info(users)`);
            const hasCurrencyColumn = tableInfo.rows.some((row) => row.name === 'currency');
            if (!hasCurrencyColumn) {
                await (0, database_1.query)(`ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'RSD'`);
                console.log('Added currency column to existing users table');
            }
            else {
                console.log('Currency column already exists');
            }
        }
        catch (err) {
            console.log('Error checking/adding currency column:', err.message);
        }
        // Create accounts table
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'Cash' CHECK (type IN ('Cash', 'Bank Account', 'Crypto Wallet')),
        currency VARCHAR(3) NOT NULL DEFAULT 'RSD',
        balance DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Add currency column to existing accounts table if it doesn't exist
        try {
            const accountsTableInfo = await (0, database_1.query)(`PRAGMA table_info(accounts)`);
            const hasCurrencyColumn = accountsTableInfo.rows.some((row) => row.name === 'currency');
            if (!hasCurrencyColumn) {
                await (0, database_1.query)(`ALTER TABLE accounts ADD COLUMN currency TEXT DEFAULT 'RSD'`);
                console.log('Added currency column to existing accounts table');
            }
        }
        catch (err) {
            console.log('Error checking/adding currency column to accounts:', err.message);
        }
        // Create transactions table
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        description VARCHAR(255),
        category VARCHAR(100),
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        currency VARCHAR(3) NOT NULL DEFAULT 'RSD',
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Add currency column to existing transactions table if it doesn't exist
        try {
            const transactionsTableInfo = await (0, database_1.query)(`PRAGMA table_info(transactions)`);
            const hasCurrencyColumn = transactionsTableInfo.rows.some((row) => row.name === 'currency');
            if (!hasCurrencyColumn) {
                await (0, database_1.query)(`ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'RSD'`);
                console.log('Added currency column to existing transactions table');
            }
        }
        catch (err) {
            console.log('Error checking/adding currency column to transactions:', err.message);
        }
        // Create archived_transactions table for data archival
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS archived_transactions (
        id SERIAL PRIMARY KEY,
        original_id INTEGER,
        user_id INTEGER,
        account_id INTEGER,
        amount DECIMAL(10,2) NOT NULL,
        description VARCHAR(255),
        category VARCHAR(100),
        type VARCHAR(20) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'RSD',
        date TIMESTAMP,
        archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Create categories table
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Create indexes for better query performance
        try {
            await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
            await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)`);
            await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
            await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`);
            await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)`);
            await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)`);
            await (0, database_1.query)(`CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)`);
            console.log('Database indexes created successfully');
        }
        catch (indexError) {
            console.log('Error creating indexes:', indexError);
        }
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
//# sourceMappingURL=initDb.js.map