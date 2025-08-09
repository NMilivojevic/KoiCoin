export interface User {
    id: number;
    username: string;
    name: string;
    password_hash: string;
    currency: string;
    created_at: Date;
}
export type Currency = "RSD" | "EUR" | "USD" | "HUF";
export interface Account {
    id: number;
    user_id: number;
    name: string;
    type: "Cash" | "Bank Account" | "Crypto Wallet";
    currency: Currency;
    balance: number;
    created_at: Date;
}
export interface Transaction {
    id: number;
    user_id: number;
    account_id: number;
    amount: number;
    description?: string;
    category?: string;
    type: "income" | "expense";
    currency: Currency;
    date: Date;
    created_at: Date;
}
export interface CreateUserRequest {
    username: string;
    name: string;
    password: string;
}
export interface LoginRequest {
    username: string;
    password: string;
}
export interface CreateTransactionRequest {
    account_id: number;
    amount: number;
    description?: string;
    category?: string;
    type: "income" | "expense";
    currency: Currency;
    date?: Date;
}
export interface UpdateTransactionRequest {
    account_id?: number;
    amount?: number;
    description?: string;
    category?: string;
    type?: "income" | "expense";
    currency?: Currency;
    date?: Date;
}
export interface CreateAccountRequest {
    name: string;
    type: "Cash" | "Bank Account" | "Crypto Wallet";
    currency: Currency;
    balance?: number;
}
export interface UpdateAccountRequest {
    name?: string;
    type?: "Cash" | "Bank Account" | "Crypto Wallet";
    currency?: Currency;
    balance?: number;
}
export interface Category {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    type: "expense" | "income";
    created_at: Date;
}
export interface CreateCategoryRequest {
    name: string;
    description?: string;
    type: "expense" | "income";
}
export interface UpdateCategoryRequest {
    name?: string;
    description?: string;
}
//# sourceMappingURL=types.d.ts.map