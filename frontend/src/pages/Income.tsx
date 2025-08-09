import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import { formatTransactionCurrency, convertCurrency } from "../utils/currency";
import { transactionApi, type Transaction } from "../utils/api";
import TransactionModal, {
    type TransactionFormData,
} from "../components/TransactionModal";

interface IncomeProps {
    onLogout: () => void;
}

const Income: React.FC<IncomeProps> = ({ onLogout }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTransaction, setEditTransaction] = useState<Transaction | null>(
        null
    );
    const [stats, setStats] = useState({
        today: 0,
        week: 0,
        month: 0,
        total: 0,
    });
    const location = useLocation();
    const { currency, exchangeRates } = useCurrency();

    const navigation = [
        { name: "Dashboard", href: "/dashboard", icon: "🏠" },
        { name: "Expenses", href: "/expenses", icon: "💰" },
        { name: "Income", href: "/income", icon: "💵" },
        { name: "Settings", href: "/settings", icon: "⚙️" },
    ];

    const isCurrentPath = (path: string) => location.pathname === path;

    useEffect(() => {
        fetchIncome();
        fetchIncomeStats();
    }, []);

    const fetchIncome = async () => {
        try {
            setLoading(true);
            const response = await transactionApi.getTransactionsByType(
                "income",
                50,
                0
            );
            setTransactions(response.transactions);
        } catch (error) {
            console.error("Error fetching income:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIncomeStats = async () => {
        try {
            const [todayStats, weekStats, monthStats] = await Promise.all([
                transactionApi.getTransactionStats("today"),
                transactionApi.getTransactionStats("week"),
                transactionApi.getTransactionStats("month"),
            ]);

            // Sum all income transactions and convert to user's preferred currency
            const todayIncome = todayStats.transactions
                .filter((t) => t.type === "income")
                .reduce((total, t) => {
                    const convertedAmount = convertCurrency(
                        t.total,
                        t.currency,
                        currency,
                        exchangeRates
                    );
                    return total + convertedAmount;
                }, 0);

            const weekIncome = weekStats.transactions
                .filter((t) => t.type === "income")
                .reduce((total, t) => {
                    const convertedAmount = convertCurrency(
                        t.total,
                        t.currency,
                        currency,
                        exchangeRates
                    );
                    return total + convertedAmount;
                }, 0);

            const monthIncome = monthStats.transactions
                .filter((t) => t.type === "income")
                .reduce((total, t) => {
                    const convertedAmount = convertCurrency(
                        t.total,
                        t.currency,
                        currency,
                        exchangeRates
                    );
                    return total + convertedAmount;
                }, 0);

            // Calculate total from all transactions with currency conversion
            const totalIncome = transactions.reduce((sum, t) => {
                const convertedAmount = convertCurrency(
                    t.amount,
                    t.currency,
                    currency,
                    exchangeRates
                );
                return sum + convertedAmount;
            }, 0);

            setStats({
                today: todayIncome,
                week: weekIncome,
                month: monthIncome,
                total: totalIncome,
            });
        } catch (error) {
            console.error("Error fetching income stats:", error);
        }
    };

    const handleCreateTransaction = async (
        transactionData: TransactionFormData
    ) => {
        try {
            await transactionApi.createTransaction(transactionData);
            fetchIncome();
            fetchIncomeStats();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error creating transaction:", error);
            throw error;
        }
    };

    const handleEditTransaction = async (
        transactionData: TransactionFormData
    ) => {
        if (!editTransaction) return;

        try {
            await transactionApi.updateTransaction(
                editTransaction.id,
                transactionData
            );
            fetchIncome();
            fetchIncomeStats();
            setIsModalOpen(false);
            setEditTransaction(null);
        } catch (error) {
            console.error("Error updating transaction:", error);
            throw error;
        }
    };

    const handleDeleteTransaction = async (id: number) => {
        if (!confirm("Are you sure you want to delete this transaction?"))
            return;

        try {
            await transactionApi.deleteTransaction(id);
            fetchIncome();
            fetchIncomeStats();
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert("Failed to delete transaction");
        }
    };

    const formatAmount = (amount: number, transactionCurrency: string) => {
        // Convert to display currency
        const convertedAmount = convertCurrency(
            amount,
            transactionCurrency as any,
            currency,
            exchangeRates
        );
        return formatTransactionCurrency(convertedAmount, currency);
    };

    return (
        <div className="min-h-screen bg-gradient-koi">
            {/* Navigation Header */}
            <nav className="bg-koi-dark border-b border-koi-border">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-koi-text">
                                🐠 KoiCoin
                            </h1>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`${
                                        isCurrentPath(item.href)
                                            ? "text-koi-orange"
                                            : "text-koi-muted hover:text-koi-text"
                                    } px-3 py-2 text-sm font-medium transition-colors`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <button
                                onClick={onLogout}
                                className="bg-red-600 hover:bg-red-700 text-koi-text px-4 py-2 rounded text-sm transition-colors"
                            >
                                Logout
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() =>
                                    setIsMobileMenuOpen(!isMobileMenuOpen)
                                }
                                className="text-gray-300 hover:text-white p-2"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden">
                            <div className="pt-2 pb-3 space-y-1">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`${
                                            isCurrentPath(item.href)
                                                ? "bg-gray-700 text-white"
                                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                        } block px-3 py-2 text-base font-medium`}
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        <span className="mr-2">
                                            {item.icon}
                                        </span>
                                        {item.name}
                                    </Link>
                                ))}
                                <div className="border-t border-gray-700 pt-4 pb-3">
                                    <button
                                        onClick={onLogout}
                                        className="block w-full text-left px-3 py-2 text-base font-medium text-red-400 hover:text-red-300"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-koi-text">💵 Income</h1>
                    <p className="mt-2 text-koi-muted">
                        Watch your income koi swim upstream
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Today's Income */}
                    <div className="bg-koi-dark overflow-hidden shadow-lg rounded-xl p-6 border border-koi-border hover:border-koi-green transition-colors">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-koi-green rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">
                                        📅
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-koi-muted">
                                    Today
                                </p>
                                <p className="text-2xl font-bold text-koi-green">
                                    +{formatAmount(stats.today, "RSD")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* This Week */}
                    <div className="bg-koi-dark overflow-hidden shadow-lg rounded-xl p-6 border border-koi-border hover:border-koi-green transition-colors">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-koi-gold rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">
                                        📊
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-koi-muted">
                                    This Week
                                </p>
                                <p className="text-2xl font-bold text-koi-green">
                                    +{formatAmount(stats.week, "RSD")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* This Month */}
                    <div className="bg-koi-dark overflow-hidden shadow-lg rounded-xl p-6 border border-koi-border hover:border-koi-green transition-colors">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-koi-blue rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">
                                        🗓️
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-koi-muted">
                                    This Month
                                </p>
                                <p className="text-2xl font-bold text-koi-green">
                                    +{formatAmount(stats.month, "RSD")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Total Transactions */}
                    <div className="bg-koi-dark overflow-hidden shadow-lg rounded-xl p-6 border border-koi-border hover:border-koi-green transition-colors">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-koi-orange rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">
                                        #
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-koi-muted">
                                    Transactions
                                </p>
                                <p className="text-2xl font-bold text-koi-text">
                                    {transactions.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="bg-koi-dark shadow-lg rounded-xl border border-koi-border">
                    <div className="px-6 py-4 border-b border-koi-border">
                        <h3 className="text-lg leading-6 font-semibold text-koi-text">
                            All Income
                        </h3>
                        <p className="mt-1 text-sm text-koi-muted">
                            Your earnings history
                        </p>
                    </div>
                    <div className="px-6 py-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="text-koi-muted">
                                    Loading income...
                                </div>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-koi-muted mb-4">
                                    No income found
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-koi-green hover:bg-green-600 text-koi-text px-4 py-2 rounded-lg transition-colors"
                                >
                                    Add Your First Income
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between py-3 border-b border-koi-border last:border-b-0 hover:bg-koi-deep/50 transition-colors rounded-lg px-2"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-koi-green/20 border border-koi-green">
                                                <span className="text-sm">
                                                    💰
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-koi-text truncate">
                                                    {transaction.description ||
                                                        "No description"}
                                                </p>
                                                <p className="text-xs text-koi-muted">
                                                    {transaction.category && (
                                                        <span>
                                                            {
                                                                transaction.category
                                                            }{" "}
                                                            •{" "}
                                                        </span>
                                                    )}
                                                    {transaction.account_name} •{" "}
                                                    {new Date(
                                                        transaction.date
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-koi-green">
                                                    +
                                                    {formatTransactionCurrency(
                                                        transaction.amount,
                                                        transaction.currency
                                                    )}
                                                </p>
                                                <p className="text-xs text-koi-muted">
                                                    {formatAmount(
                                                        transaction.amount,
                                                        transaction.currency
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => {
                                                        setEditTransaction(
                                                            transaction
                                                        );
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="text-koi-muted hover:text-koi-blue p-1 transition-colors"
                                                    title="Edit transaction"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteTransaction(
                                                            transaction.id
                                                        )
                                                    }
                                                    className="text-koi-muted hover:text-red-400 p-1 transition-colors"
                                                    title="Delete transaction"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-2xl font-bold"
                    title="Add income"
                >
                    +
                </button>
            </div>

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditTransaction(null);
                }}
                onSubmit={
                    editTransaction
                        ? handleEditTransaction
                        : handleCreateTransaction
                }
                transactionType="income"
                editTransaction={editTransaction}
            />
        </div>
    );
};

export default Income;
