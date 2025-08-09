import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import {
    formatCurrencyFromRSD,
    convertCurrency,
    formatTransactionCurrency,
} from "../utils/currency";
import {
    transactionApi,
    accountApi,
    type Transaction,
    type Account,
} from "../utils/api";
import TransactionModal, {
    type TransactionFormData,
} from "../components/TransactionModal";

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
        []
    );
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showTransactionTypeSelection, setShowTransactionTypeSelection] =
        useState(false);
    const [stats, setStats] = useState({
        totalBalance: 0,
        todaySpending: 0,
        weekSpending: 0,
        monthSpending: 0,
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
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch recent transactions, accounts, and stats in parallel
            const [
                transactionsData,
                accountsData,
                todayStats,
                weekStats,
                monthStats,
            ] = await Promise.all([
                transactionApi.getRecentTransactions(4),
                accountApi.getAccounts(),
                transactionApi.getTransactionStats("today"),
                transactionApi.getTransactionStats("week"),
                transactionApi.getTransactionStats("month"),
            ]);

            setRecentTransactions(transactionsData);
            setAccounts(accountsData);

            // Calculate total balance from all accounts
            const totalBalance = accountsData.reduce((total, account) => {
                const convertedBalance = convertCurrency(
                    account.balance,
                    account.currency,
                    currency,
                    exchangeRates
                );
                return total + convertedBalance;
            }, 0);

            // Sum all expense transactions and convert to user's preferred currency
            console.log("Raw stats data:", {
                todayStats,
                todayTransactions: todayStats.transactions,
                weekStats,
                weekTransactions: weekStats.transactions,
                monthStats,
                monthTransactions: monthStats.transactions,
            });

            const todayExpense = todayStats.transactions
                .filter((t) => t.type === "expense")
                .reduce((total, t) => {
                    console.log("Processing today expense:", t);
                    const convertedAmount = convertCurrency(
                        t.total,
                        t.currency,
                        currency,
                        exchangeRates
                    );
                    console.log("Converted amount:", convertedAmount);
                    return total + convertedAmount;
                }, 0);

            const weekExpense = weekStats.transactions
                .filter((t) => t.type === "expense")
                .reduce((total, t) => {
                    const convertedAmount = convertCurrency(
                        t.total,
                        t.currency,
                        currency,
                        exchangeRates
                    );
                    return total + convertedAmount;
                }, 0);

            const monthExpense = monthStats.transactions
                .filter((t) => t.type === "expense")
                .reduce((total, t) => {
                    const convertedAmount = convertCurrency(
                        t.total,
                        t.currency,
                        currency,
                        exchangeRates
                    );
                    return total + convertedAmount;
                }, 0);

            setStats({
                totalBalance,
                todaySpending: todayExpense,
                weekSpending: weekExpense,
                monthSpending: monthExpense,
            });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTransaction = async (
        transactionData: TransactionFormData
    ) => {
        try {
            await transactionApi.createTransaction(transactionData);
            fetchDashboardData(); // Refresh data
            setIsModalOpen(false);
            setShowTransactionTypeSelection(false);
        } catch (error) {
            console.error("Error creating transaction:", error);
            throw error;
        }
    };

    const handlePlusButtonClick = () => {
        setShowTransactionTypeSelection(true);
    };

    const handleTransactionTypeSelect = (type: "income" | "expense") => {
        setShowTransactionTypeSelection(false);
        setIsModalOpen(true);
    };

    const formatAmount = (amount: number, transactionCurrency: string) => {
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
                                                ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                                                : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                                        } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
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
                                <div className="border-t border-gray-200 pt-4 pb-3">
                                    <button
                                        onClick={onLogout}
                                        className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
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
                {/* Dashboard Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-koi-text">
                        🌊 Dashboard
                    </h1>
                    <p className="mt-2 text-koi-muted">
                        Watch your financial koi swim gracefully
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Balance Card */}
                    <div className="bg-koi-dark overflow-hidden shadow-lg rounded-xl p-6 border border-koi-border hover:border-koi-green transition-colors">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-koi-green rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">
                                        💰
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-koi-muted">
                                    Total Balance
                                </p>
                                <p className="text-2xl font-bold text-koi-gold">
                                    {loading
                                        ? "Loading..."
                                        : formatTransactionCurrency(
                                              stats.totalBalance,
                                              currency
                                          )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Today's Spending */}
                    <div className="bg-koi-dark overflow-hidden shadow-lg rounded-xl p-6 border border-koi-border hover:border-koi-green transition-colors">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-koi-orange rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">
                                        📅
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-koi-muted">
                                    Today's Spending
                                </p>
                                <p className="text-2xl font-bold text-koi-orange">
                                    {loading
                                        ? "Loading..."
                                        : formatAmount(
                                              stats.todaySpending,
                                              "RSD"
                                          )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* This Week */}
                    <div className="bg-koi-dark overflow-hidden shadow-lg rounded-xl p-6 border border-koi-border hover:border-koi-green transition-colors">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-koi-blue rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">
                                        📊
                                    </span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-koi-muted">
                                    This Week
                                </p>
                                <p className="text-2xl font-bold text-koi-orange">
                                    {loading
                                        ? "Loading..."
                                        : formatAmount(
                                              stats.weekSpending,
                                              "RSD"
                                          )}
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
                                <p className="text-2xl font-bold text-koi-orange">
                                    {loading
                                        ? "Loading..."
                                        : formatAmount(
                                              stats.monthSpending,
                                              "RSD"
                                          )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-koi-dark shadow-lg rounded-xl border border-koi-border">
                    <div className="px-6 py-4 border-b border-koi-border">
                        <h3 className="text-lg leading-6 font-semibold text-koi-text">
                            Recent Transactions
                        </h3>
                        <p className="mt-1 text-sm text-koi-muted">
                            Your latest financial activity
                        </p>
                    </div>
                    <div className="px-6 py-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="text-koi-muted">
                                    Loading transactions...
                                </div>
                            </div>
                        ) : recentTransactions.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-koi-muted mb-4">
                                    No recent transactions
                                </div>
                                <button
                                    onClick={handlePlusButtonClick}
                                    className="bg-koi-orange hover:bg-orange-600 text-koi-text px-4 py-2 rounded-lg transition-colors"
                                >
                                    Add Your First Transaction
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between py-3 border-b border-koi-border last:border-b-0 hover:bg-koi-deep/50 transition-colors rounded-lg px-2"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    transaction.type ===
                                                    "income"
                                                        ? "bg-koi-green/20 border border-koi-green"
                                                        : "bg-koi-orange/20 border border-koi-orange"
                                                }`}
                                            >
                                                <span className="text-sm">
                                                    {transaction.type ===
                                                    "income"
                                                        ? "💰"
                                                        : "💸"}
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
                                        <div className="text-right">
                                            <p
                                                className={`text-sm font-semibold ${
                                                    transaction.type ===
                                                    "income"
                                                        ? "text-koi-green"
                                                        : "text-koi-orange"
                                                }`}
                                            >
                                                {transaction.type === "income"
                                                    ? "+"
                                                    : "-"}
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
                                    </div>
                                ))}
                                <div className="text-center pt-4">
                                    <Link
                                        to="/expenses"
                                        className="text-koi-blue hover:text-koi-gold text-sm mr-4 transition-colors"
                                    >
                                        View All Expenses
                                    </Link>
                                    <Link
                                        to="/income"
                                        className="text-koi-blue hover:text-koi-gold text-sm transition-colors"
                                    >
                                        View All Income
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6">
                <button
                    onClick={handlePlusButtonClick}
                    className="bg-koi-orange hover:bg-orange-600 text-koi-text w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-2xl font-bold ring-2 ring-koi-gold/20 hover:ring-koi-gold/40"
                >
                    +
                </button>
            </div>

            {/* Transaction Type Selection Modal */}
            {showTransactionTypeSelection && (
                <div className="fixed inset-0 bg-koi-deep bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-koi-dark rounded-lg max-w-sm w-full border border-koi-border shadow-2xl">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-koi-text mb-4 text-center">
                                Choose Transaction Type
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() =>
                                        handleTransactionTypeSelect("expense")
                                    }
                                    className="flex flex-col items-center p-4 bg-koi-orange hover:bg-orange-600 rounded-lg transition-colors shadow-lg"
                                >
                                    <span className="text-2xl mb-2">💸</span>
                                    <span className="text-koi-text font-medium">
                                        Expense
                                    </span>
                                </button>
                                <button
                                    onClick={() =>
                                        handleTransactionTypeSelect("income")
                                    }
                                    className="flex flex-col items-center p-4 bg-koi-green hover:bg-green-600 rounded-lg transition-colors shadow-lg"
                                >
                                    <span className="text-2xl mb-2">💰</span>
                                    <span className="text-koi-text font-medium">
                                        Income
                                    </span>
                                </button>
                            </div>
                            <button
                                onClick={() =>
                                    setShowTransactionTypeSelection(false)
                                }
                                className="w-full mt-4 bg-koi-border hover:bg-gray-600 text-koi-text py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setShowTransactionTypeSelection(false);
                }}
                onSubmit={handleCreateTransaction}
            />
        </div>
    );
};

export default Dashboard;
