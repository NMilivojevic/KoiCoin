import { type Currency } from "./currency";
import { type TransactionFormData } from "../components/TransactionModal";

const API_BASE_URL = "http://localhost:3001/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
};

// Transaction interfaces
export interface Transaction {
    id: number;
    user_id: number;
    account_id: number;
    amount: number;
    description?: string;
    category?: string;
    type: "income" | "expense";
    currency: Currency;
    date: string;
    created_at: string;
    account_name?: string;
    account_type?: string;
}

export interface TransactionFilters {
    type?: "income" | "expense";
    account_id?: number;
    category?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
    sort?: "date" | "amount" | "created_at";
    order?: "asc" | "desc";
}

export interface TransactionResponse {
    transactions: Transaction[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        has_more: boolean;
    };
}

export interface TransactionStats {
    period: string;
    transactions: Array<{
        type: "income" | "expense";
        currency: Currency;
        total: number;
        count: number;
    }>;
    account_balances: Array<{
        currency: Currency;
        total_balance: number;
    }>;
}

// Transaction API functions
export const transactionApi = {
    // Get all transactions with filters
    async getTransactions(
        filters: TransactionFilters = {}
    ): Promise<TransactionResponse> {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value.toString());
            }
        });

        const response = await fetch(
            `${API_BASE_URL}/transactions?${params.toString()}`,
            {
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch transactions");
        }

        return response.json();
    },

    // Get transaction by ID
    async getTransaction(id: number): Promise<Transaction> {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch transaction");
        }

        return response.json();
    },

    // Create new transaction
    async createTransaction(
        transaction: TransactionFormData
    ): Promise<Transaction> {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(transaction),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create transaction");
        }

        return response.json();
    },

    // Update transaction
    async updateTransaction(
        id: number,
        transaction: Partial<TransactionFormData>
    ): Promise<Transaction> {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(transaction),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to update transaction");
        }

        return response.json();
    },

    // Delete transaction
    async deleteTransaction(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete transaction");
        }
    },

    // Get transaction statistics
    async getTransactionStats(
        period: "today" | "week" | "month" | "year" = "month"
    ): Promise<TransactionStats> {
        const response = await fetch(
            `${API_BASE_URL}/transactions/stats/summary?period=${period}`,
            {
                headers: getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch transaction statistics");
        }

        return response.json();
    },

    // Get recent transactions (shorthand for common use case)
    async getRecentTransactions(limit = 10): Promise<Transaction[]> {
        const response = await this.getTransactions({
            limit,
            sort: "date",
            order: "desc",
        });

        return response.transactions;
    },

    // Get transactions by type (shorthand for expense/income filtering)
    async getTransactionsByType(
        type: "income" | "expense",
        limit = 50,
        offset = 0
    ): Promise<TransactionResponse> {
        return this.getTransactions({
            type,
            limit,
            offset,
            sort: "date",
            order: "desc",
        });
    },
};

// Account API functions (already exists in codebase, but adding here for completeness)
export interface Account {
    id: number;
    user_id: number;
    name: string;
    type: "Cash" | "Bank Account" | "Crypto Wallet";
    currency: Currency;
    balance: number;
    created_at: string;
}

export const accountApi = {
    async getAccounts(): Promise<Account[]> {
        const response = await fetch(`${API_BASE_URL}/accounts`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch accounts");
        }

        return response.json();
    },
};

// Category API functions
export interface Category {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    type: "expense" | "income";
    created_at: string;
}

export const categoryApi = {
    async getCategories(type?: "expense" | "income"): Promise<Category[]> {
        const params = type ? `?type=${type}` : "";
        const response = await fetch(`${API_BASE_URL}/categories${params}`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch categories");
        }

        return response.json();
    },
};
