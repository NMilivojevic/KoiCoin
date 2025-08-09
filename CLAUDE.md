# KoiCoin - Claude Development Guide

## Project Overview

🐠 KoiCoin is a personal finance tracking web application with a beautiful koi-inspired dark theme, username-based authentication, and SQLite database. Like koi swimming gracefully in a moonlit pond, your finances flow with elegance and purpose.

## Development Commands

### Frontend (React + TypeScript + Vite)

```bash
cd frontend
npm run dev      # Start development server on :5173
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend (Express + TypeScript + SQLite)

```bash
cd backend
npm run dev      # Start development server on :3001
npm run build    # Compile TypeScript to JavaScript
npm start        # Run compiled JavaScript
```

## Current Tech Stack

-   **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v3
-   **Backend**: Express + TypeScript + Node.js
-   **Database**: SQLite (finance_tracker.db)
-   **Authentication**: JWT tokens with bcrypt password hashing
-   **Styling**: Koi-inspired dark theme with custom Tailwind CSS color palette

## Project Status

✅ **COMPLETED**

-   Project setup (React + Express + SQLite)
-   Authentication system (username/name/password)
-   Dark theme UI (all backgrounds are dark - no light colors)
-   Tailwind CSS v3 working properly
-   Database schema and clean setup
-   Account management (CRUD operations in Settings)
-   Category management (expense/income categories with descriptions)
-   Currency preferences and multi-currency support
-   Settings page with user profile management
-   **Transaction System (FULLY IMPLEMENTED)**:
    -   Complete CRUD operations for transactions
    -   Transaction-Account relationship with automatic balance updates
    -   Multi-currency support with real-time conversion
    -   Account selection in transaction forms
    -   Transaction archival on deletion
    -   Database transaction safety for balance consistency
-   **Dashboard & Statistics**:
    -   Real-time spending statistics (Today/Week/Month)
    -   Total balance calculations across accounts
    -   Recent transactions display with account information
    -   Plus button for quick transaction entry
-   **Expense & Income Pages**:
    -   Full transaction management with edit/delete capabilities
    -   Statistics display for each transaction type
    -   Mobile-responsive design with floating action buttons

🔄 **NEXT PHASE**

-   CSV export system
-   Advanced filtering and search
-   Recurring transactions
-   Budget planning features
-   Data visualization charts

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  currency TEXT DEFAULT 'RSD',
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Accounts table
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Cash' CHECK (type IN ('Cash', 'Bank Account', 'Crypto Wallet')),
  currency TEXT NOT NULL DEFAULT 'RSD',
  balance REAL DEFAULT 0.00,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Categories table
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Transactions table
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  description TEXT,
  category TEXT,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  date DATETIME DEFAULT (datetime('now')),
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Archived transactions table
CREATE TABLE archived_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_id INTEGER,
  user_id INTEGER,
  account_id INTEGER,
  amount REAL NOT NULL,
  description TEXT,
  category TEXT,
  type TEXT NOT NULL,
  date DATETIME,
  archived_at DATETIME DEFAULT (datetime('now'))
);
```

## Authentication Flow

-   **Registration**: username + name + password → JWT token
-   **Login**: username + password → JWT token
-   **Protected Routes**: JWT middleware validates tokens
-   **Token Payload**: `{id, username, name, iat, exp}`

## Key Files & Directories

### Backend Structure

```
backend/src/
├── server.ts              # Main Express server
├── routes/
│   ├── auth.ts            # Authentication endpoints
│   ├── user.ts            # User profile management
│   ├── accounts.ts        # Account CRUD operations
│   ├── categories.ts      # Category CRUD operations
│   └── transactions.ts    # Transaction CRUD with balance management
├── middleware/auth.ts     # JWT authentication middleware
├── models/types.ts        # TypeScript interfaces (User, Account, Category, Transaction)
├── utils/database.ts      # SQLite database connection with query wrapper
└── utils/initDb.ts        # Database initialization and migrations
```

### Frontend Structure

```
frontend/src/
├── App.tsx                # Main app with routing
├── pages/
│   ├── Login.tsx          # Login page (username/password)
│   ├── Register.tsx       # Register page (username/name/password)
│   ├── Dashboard.tsx      # Dashboard with real-time statistics
│   ├── Expenses.tsx       # Expense management page
│   ├── Income.tsx         # Income management page
│   └── Settings.tsx       # Settings page with account/category management
├── components/
│   └── TransactionModal.tsx # Transaction creation/editing modal
├── context/
│   └── CurrencyContext.tsx # Currency management context
├── utils/
│   ├── currency.ts        # Currency utilities and exchange rates
│   └── api.ts             # API helper functions and interfaces
└── index.css              # Tailwind CSS imports
```

## API Endpoints

### Authentication
-   `POST /api/auth/register` - Create new user
-   `POST /api/auth/login` - Authenticate user

### User Management
-   `GET /api/user/me` - Get current user profile
-   `PUT /api/user/currency` - Update user's preferred currency

### Account Management
-   `GET /api/accounts` - Get all user accounts
-   `POST /api/accounts` - Create new account
-   `PUT /api/accounts/:id` - Update account
-   `DELETE /api/accounts/:id` - Delete account

### Category Management
-   `GET /api/categories` - Get all user categories (optional ?type=expense|income filter)
-   `POST /api/categories` - Create new category
-   `PUT /api/categories/:id` - Update category
-   `DELETE /api/categories/:id` - Delete category

### Transaction Management
-   `GET /api/transactions` - Get all user transactions with filtering and pagination
-   `GET /api/transactions/:id` - Get specific transaction by ID
-   `POST /api/transactions` - Create new transaction (auto-updates account balance)
-   `PUT /api/transactions/:id` - Update transaction (handles balance recalculation)
-   `DELETE /api/transactions/:id` - Delete transaction (archives + reverts balance)
-   `GET /api/transactions/stats/summary` - Get transaction statistics by period
-   `GET /api/transactions/debug/all` - Debug endpoint for transaction data

### Health Check
-   `GET /api/health` - Health check

## Styling Guidelines

-   **Theme**: Dark only - no light backgrounds
-   **Colors**:
    -   Background: `bg-gray-900` (darkest)
    -   Cards: `bg-gray-800`
    -   Inputs: `bg-gray-700`
    -   Text: `text-white` (primary), `text-gray-400` (secondary)
    -   Borders: `border-gray-700`
-   **Accents**: Blue (`bg-blue-600`), Green/Red for income/expense

## Common Issues & Solutions

### 1. Tailwind CSS Not Working

-   Ensure Tailwind v3 is installed (not v4)
-   Check `postcss.config.js` uses `export default`
-   Restart dev server after config changes

### 2. Database Connection Issues

-   Database file auto-creates on first run
-   Delete `finance_tracker.db` to reset completely
-   Check backend console for initialization logs

### 3. Authentication Problems

-   Clear localStorage and try fresh login
-   Check JWT_SECRET is set in `.env`
-   Verify username (not email) in requests

### 4. Dashboard Statistics Showing 0.00 (FIXED)

**Issue**: Dashboard spending statistics (Today/Week/Month) showed 0.00 despite existing transactions.

**Root Cause**: 
- Date storage format incompatibility with SQLite DATE() functions
- Multi-currency transactions not properly aggregated
- Missing currency conversion in statistics calculation

**Solution Applied**:
- ✅ Fixed date storage: Store as YYYY-MM-DD strings instead of JavaScript Date objects
- ✅ Added localtime timezone handling in SQLite queries
- ✅ Updated frontend to aggregate multi-currency transactions with proper conversion
- ✅ Enhanced statistics calculation to handle all currencies

**Files Modified**:
- `backend/src/routes/transactions.ts` - Date formatting and timezone fixes
- `frontend/src/pages/Dashboard.tsx` - Multi-currency aggregation
- `frontend/src/pages/Expenses.tsx` - Statistics calculation fixes
- `frontend/src/pages/Income.tsx` - Statistics calculation fixes

## Test Data

Create test user:

-   Username: `testuser`
-   Name: `Test User`
-   Password: `password123`

## Development Notes

-   Database resets automatically when backend restarts
-   Frontend hot reloads on file changes
-   Use browser dev tools to inspect JWT tokens
-   All API calls go to `http://localhost:3001`

## Category Management Features

### Implementation Details
- **Location**: Integrated into Settings page under "Category Management"
- **UI**: Tabbed interface separating expense and income categories
- **Features**: Full CRUD operations with name and description fields
- **Validation**: Prevents duplicate category names within the same type
- **Protection**: Cannot delete categories that are used in transactions
- **Design**: Mobile-responsive with dark theme consistency

### Category Types
- **Expense Categories**: For organizing spending (red theme)
- **Income Categories**: For organizing earnings (green theme)

## Transaction System Features

### Implementation Details
- **Transaction Modal**: Universal component for creating/editing transactions with account selection
- **Account Integration**: Transactions automatically linked to accounts with balance updates
- **Multi-Currency Support**: Handles transactions in different currencies with real-time conversion
- **Database Safety**: All balance updates wrapped in database transactions for consistency
- **Transaction Archival**: Deleted transactions are archived for audit trail
- **Statistics Engine**: Real-time calculation of spending/income by period (today/week/month)

### Transaction Types
- **Expense Transactions**: Decrease account balance, tracked in red theme
- **Income Transactions**: Increase account balance, tracked in green theme

### Balance Management
- **Automatic Updates**: Account balances update immediately on transaction create/edit/delete
- **Multi-Account Support**: Each transaction linked to specific account
- **Currency Handling**: Transactions can be in different currency than account
- **Consistency**: Database transactions ensure balance integrity

## Architecture Highlights

### Database Transaction Safety
All balance-affecting operations use SQLite transactions:
```sql
BEGIN TRANSACTION;
-- Insert/Update/Delete transaction
-- Update account balance
COMMIT; -- or ROLLBACK on error
```

### Multi-Currency Statistics
Frontend aggregates statistics across currencies:
```typescript
const todayExpense = todayStats.transactions
  .filter(t => t.type === "expense")
  .reduce((total, t) => {
    const convertedAmount = convertCurrency(t.total, t.currency, currency, exchangeRates);
    return total + convertedAmount;
  }, 0);
```

### Date Handling Fix
SQLite-compatible date storage:
```typescript
// Store dates as YYYY-MM-DD strings
const dateString = transactionDate.toISOString().split('T')[0];
// Query with localtime for timezone accuracy
"AND DATE(t.date) = DATE('now', 'localtime')"
```

## Ready for Next Features

The core transaction system is now fully functional. Next development should focus on:

1. CSV export system with date range selection
2. Advanced filtering and search capabilities
3. Recurring transactions functionality
4. Budget planning and tracking features
5. Data visualization charts and graphs
6. Transaction categories analytics
7. Monthly/yearly spending reports

---

**Last Updated**: 2025-08-09
**Claude Context**: Complete transaction system implemented with account integration, multi-currency support, and real-time statistics. Dashboard statistics issue fixed with proper date handling and currency conversion. All balance updates are database-transaction safe. Ready for advanced features like export and analytics.
