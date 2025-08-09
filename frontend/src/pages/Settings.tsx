import { useState, useEffect } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { Link, useLocation } from "react-router-dom";
import { type Currency, currencyNames } from "../utils/currency";

interface UserProfile {
    id: number;
    username: string;
    name: string;
    currency: Currency;
}

interface Account {
    id: number;
    user_id: number;
    name: string;
    type: "Cash" | "Bank Account" | "Crypto Wallet";
    currency: Currency;
    balance: number;
    created_at: string;
}

interface Category {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    type: "expense" | "income";
    created_at: string;
}

interface SettingsProps {
    onLogout: () => void;
}

const Settings = ({ onLogout }: SettingsProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { currency, setCurrency, loading, error } = useCurrency();
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState("");
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState("");

    const navigation = [
        { name: "Dashboard", href: "/dashboard", icon: "🏠" },
        { name: "Expenses", href: "/expenses", icon: "💰" },
        { name: "Income", href: "/income", icon: "💵" },
        { name: "Settings", href: "/settings", icon: "⚙️" },
    ];

    const isCurrentPath = (path: string) => location.pathname === path;

    // Accounts state
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [accountsError, setAccountsError] = useState("");
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [accountFormData, setAccountFormData] = useState({
        name: "",
        type: "Cash" as "Cash" | "Bank Account" | "Crypto Wallet",
        currency: "RSD" as Currency,
        balance: 0,
    });

    // Categories state
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState("");
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );
    const [categoryFormData, setCategoryFormData] = useState({
        name: "",
        description: "",
        type: "expense" as "expense" | "income",
    });
    const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

    const fetchUserProfile = async () => {
        setProfileLoading(true);
        setProfileError("");

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setProfileError("No authentication token found");
                return;
            }

            const response = await fetch("http://localhost:3001/api/user/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user profile");
            }

            const userData = await response.json();
            setUserProfile(userData);
        } catch (err) {
            setProfileError(
                err instanceof Error ? err.message : "Failed to load profile"
            );
        } finally {
            setProfileLoading(false);
        }
    };

    const handleCurrencyChange = async (newCurrency: Currency) => {
        setIsUpdating(true);
        setUpdateMessage("");

        try {
            await setCurrency(newCurrency);
            setUpdateMessage("Currency updated successfully!");
            // Update local profile data
            if (userProfile) {
                setUserProfile({ ...userProfile, currency: newCurrency });
            }
            setTimeout(() => setUpdateMessage(""), 3000);
        } catch (err) {
            console.error("Failed to update currency:", err);
            setUpdateMessage("Failed to update currency. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    // Account management functions
    const fetchAccounts = async () => {
        setAccountsLoading(true);
        setAccountsError("");

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setAccountsError("No authentication token found");
                return;
            }

            const response = await fetch("http://localhost:3001/api/accounts", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch accounts");
            }

            const accountsData = await response.json();
            setAccounts(accountsData);
        } catch (err) {
            setAccountsError(
                err instanceof Error ? err.message : "Failed to load accounts"
            );
        } finally {
            setAccountsLoading(false);
        }
    };

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const url = editingAccount
                ? `http://localhost:3001/api/accounts/${editingAccount.id}`
                : "http://localhost:3001/api/accounts";

            const method = editingAccount ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(accountFormData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save account");
            }

            await fetchAccounts();
            setShowAccountForm(false);
            setEditingAccount(null);
            setAccountFormData({
                name: "",
                type: "Cash",
                currency: "RSD",
                balance: 0,
            });
        } catch (err) {
            setAccountsError(
                err instanceof Error ? err.message : "Failed to save account"
            );
        }
    };

    const handleEditAccount = (account: Account) => {
        setEditingAccount(account);
        setAccountFormData({
            name: account.name,
            type: account.type,
            currency: account.currency,
            balance: account.balance,
        });
        setShowAccountForm(true);
    };

    const handleDeleteAccount = async (accountId: number) => {
        if (
            !confirm(
                "Are you sure you want to delete this account? This action cannot be undone."
            )
        ) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(
                `http://localhost:3001/api/accounts/${accountId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete account");
            }

            await fetchAccounts();
        } catch (err) {
            setAccountsError(
                err instanceof Error ? err.message : "Failed to delete account"
            );
        }
    };

    const resetAccountForm = () => {
        setShowAccountForm(false);
        setEditingAccount(null);
        setAccountFormData({
            name: "",
            type: "Cash",
            currency: "RSD",
            balance: 0,
        });
    };

    // Category management functions
    const fetchCategories = async () => {
        setCategoriesLoading(true);
        setCategoriesError("");

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setCategoriesError("No authentication token found");
                return;
            }

            const response = await fetch(
                "http://localhost:3001/api/categories",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch categories");
            }

            const categoriesData = await response.json();
            setCategories(categoriesData);
        } catch (err) {
            setCategoriesError(
                err instanceof Error ? err.message : "Failed to load categories"
            );
        } finally {
            setCategoriesLoading(false);
        }
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const url = editingCategory
                ? `http://localhost:3001/api/categories/${editingCategory.id}`
                : "http://localhost:3001/api/categories";

            const method = editingCategory ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(categoryFormData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to save category");
            }

            await fetchCategories();
            setShowCategoryForm(false);
            setEditingCategory(null);
            setCategoryFormData({
                name: "",
                description: "",
                type: "expense",
            });
        } catch (err) {
            setCategoriesError(
                err instanceof Error ? err.message : "Failed to save category"
            );
        }
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryFormData({
            name: category.name,
            description: category.description || "",
            type: category.type,
        });
        setActiveTab(category.type);
        setShowCategoryForm(true);
    };

    const handleDeleteCategory = async (categoryId: number) => {
        if (
            !confirm(
                "Are you sure you want to delete this category? This action cannot be undone."
            )
        ) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await fetch(
                `http://localhost:3001/api/categories/${categoryId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || "Failed to delete category"
                );
            }

            await fetchCategories();
        } catch (err) {
            setCategoriesError(
                err instanceof Error ? err.message : "Failed to delete category"
            );
        }
    };

    const resetCategoryForm = () => {
        setShowCategoryForm(false);
        setEditingCategory(null);
        setCategoryFormData({
            name: "",
            description: "",
            type: "expense",
        });
    };

    const handleAddCategory = (type: "expense" | "income") => {
        setCategoryFormData({
            name: "",
            description: "",
            type: type,
        });
        setActiveTab(type);
        setShowCategoryForm(true);
    };

    useEffect(() => {
        fetchUserProfile();
        fetchAccounts();
        fetchCategories();
    }, []);

    const currencies: Currency[] = ["RSD", "EUR", "USD"];

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Navigation Header */}
            <nav className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-white">
                                Finance Tracker
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
                                            ? "text-blue-400"
                                            : "text-gray-300 hover:text-white"
                                    } px-3 py-2 text-sm font-medium`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <button
                                onClick={onLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="mt-2 text-gray-400">
                        Manage your account preferences
                    </p>
                </div>

                {/* Settings Cards */}
                <div className="space-y-6">
                    {/* Currency Settings */}
                    <div className="bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-700">
                            <h3 className="text-lg leading-6 font-semibold text-white">
                                Currency Preferences
                            </h3>
                            <p className="mt-1 text-sm text-gray-400">
                                Choose your preferred display currency
                            </p>
                        </div>

                        <div className="px-6 py-4">
                            {error && (
                                <div className="mb-4 bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {updateMessage && (
                                <div className="mb-4 bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
                                    {updateMessage}
                                </div>
                            )}

                            <div className="space-y-3">
                                {currencies.map((curr) => (
                                    <label
                                        key={curr}
                                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                                            currency === curr
                                                ? "border-blue-500 bg-blue-900 bg-opacity-50"
                                                : "border-gray-600 hover:border-gray-500"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="currency"
                                            value={curr}
                                            checked={currency === curr}
                                            onChange={() =>
                                                handleCurrencyChange(curr)
                                            }
                                            disabled={loading || isUpdating}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-white">
                                                {currencyNames[curr]}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {curr === "RSD" &&
                                                    "Serbian Dinar - default currency"}
                                                {curr === "EUR" &&
                                                    "Euro - converted from RSD for display"}
                                                {curr === "USD" &&
                                                    "US Dollar - converted from RSD for display"}
                                            </div>
                                        </div>
                                        {currency === curr && (
                                            <div className="ml-auto">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Current
                                                </span>
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>

                            {(loading || isUpdating) && (
                                <div className="mt-4 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    <span className="ml-2 text-sm text-gray-400">
                                        {loading ? "Loading..." : "Updating..."}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-700">
                            <h3 className="text-lg leading-6 font-semibold text-white">
                                Account Information
                            </h3>
                            <p className="mt-1 text-sm text-gray-400">
                                Your account details
                            </p>
                        </div>

                        <div className="px-6 py-4">
                            {profileError && (
                                <div className="mb-4 bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                                    {profileError}
                                </div>
                            )}

                            {profileLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    <span className="ml-2 text-sm text-gray-400">
                                        Loading profile...
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">
                                            Username
                                        </label>
                                        <div className="mt-1 text-sm text-white">
                                            {userProfile?.username || "N/A"}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">
                                            Full Name
                                        </label>
                                        <div className="mt-1 text-sm text-white">
                                            {userProfile?.name || "N/A"}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">
                                            Display Currency
                                        </label>
                                        <div className="mt-1 text-sm text-white">
                                            {currencyNames[currency]}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Accounts Management */}
                    <div className="bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg leading-6 font-semibold text-white">
                                        Accounts Management
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-400">
                                        Manage your financial accounts
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAccountForm(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                    Add Account
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            {accountsError && (
                                <div className="mb-4 bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                                    {accountsError}
                                </div>
                            )}

                            {accountsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    <span className="ml-2 text-sm text-gray-400">
                                        Loading accounts...
                                    </span>
                                </div>
                            ) : accounts.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-4">
                                        No accounts found
                                    </div>
                                    <button
                                        onClick={() => setShowAccountForm(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                    >
                                        Create your first account
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {accounts.map((account) => (
                                        <div
                                            key={account.id}
                                            className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="text-white font-medium text-lg">
                                                        {account.name}
                                                    </h4>
                                                    <p className="text-gray-400 text-sm">
                                                        {account.type}
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            handleEditAccount(
                                                                account
                                                            )
                                                        }
                                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteAccount(
                                                                account.id
                                                            )
                                                        }
                                                        className="text-red-400 hover:text-red-300 text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400 text-sm">
                                                        Balance:
                                                    </span>
                                                    <span className="text-white font-medium">
                                                        {account.balance.toFixed(
                                                            2
                                                        )}{" "}
                                                        {account.currency}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400 text-sm">
                                                        Currency:
                                                    </span>
                                                    <span className="text-white text-sm">
                                                        {
                                                            currencyNames[
                                                                account.currency
                                                            ]
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Account Form Modal */}
                    {showAccountForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                                <div className="px-6 py-4 border-b border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-white">
                                            {editingAccount
                                                ? "Edit Account"
                                                : "Add New Account"}
                                        </h3>
                                        <button
                                            onClick={resetAccountForm}
                                            className="text-gray-400 hover:text-gray-300"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <form
                                    onSubmit={handleAccountSubmit}
                                    className="px-6 py-4 space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Account Name
                                        </label>
                                        <input
                                            type="text"
                                            value={accountFormData.name}
                                            onChange={(e) =>
                                                setAccountFormData({
                                                    ...accountFormData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter account name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Account Type
                                        </label>
                                        <select
                                            value={accountFormData.type}
                                            onChange={(e) =>
                                                setAccountFormData({
                                                    ...accountFormData,
                                                    type: e.target.value as
                                                        | "Cash"
                                                        | "Bank Account"
                                                        | "Crypto Wallet",
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Account">
                                                Bank Account
                                            </option>
                                            <option value="Crypto Wallet">
                                                Crypto Wallet
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Currency
                                        </label>
                                        <select
                                            disabled={editingAccount !== null}
                                            value={accountFormData.currency}
                                            onChange={(e) =>
                                                setAccountFormData({
                                                    ...accountFormData,
                                                    currency: e.target
                                                        .value as Currency,
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="RSD">
                                                RSD - Serbian Dinar
                                            </option>
                                            <option value="EUR">
                                                EUR - Euro
                                            </option>
                                            <option value="USD">
                                                USD - US Dollar
                                            </option>
                                        </select>
                                        {editingAccount && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                You cannot change the currency
                                                of an existing account.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Initial Balance
                                        </label>
                                        <input
                                            type="text"
                                            value={accountFormData.balance}
                                            onChange={(e) =>
                                                setAccountFormData({
                                                    ...accountFormData,
                                                    balance:
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0,
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={resetAccountForm}
                                            className="px-4 py-2 text-gray-400 hover:text-gray-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                                        >
                                            {editingAccount
                                                ? "Update Account"
                                                : "Create Account"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Category Management */}
                    <div className="bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg leading-6 font-semibold text-white">
                                        Category Management
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-400">
                                        Organize your expenses and income into
                                        categories
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                    <button
                                        onClick={() =>
                                            handleAddCategory("expense")
                                        }
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                                    >
                                        Add Expense Category
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleAddCategory("income")
                                        }
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                                    >
                                        Add Income Category
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            {categoriesError && (
                                <div className="mb-4 bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                                    {categoriesError}
                                </div>
                            )}

                            {categoriesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    <span className="ml-2 text-sm text-gray-400">
                                        Loading categories...
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Tab Navigation */}
                                    <div className="border-b border-gray-700">
                                        <nav className="-mb-px flex space-x-8">
                                            <button
                                                onClick={() =>
                                                    setActiveTab("expense")
                                                }
                                                className={`${
                                                    activeTab === "expense"
                                                        ? "border-red-500 text-red-400"
                                                        : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                                                } whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm`}
                                            >
                                                Expense Categories (
                                                {
                                                    categories.filter(
                                                        (c) =>
                                                            c.type === "expense"
                                                    ).length
                                                }
                                                )
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setActiveTab("income")
                                                }
                                                className={`${
                                                    activeTab === "income"
                                                        ? "border-green-500 text-green-400"
                                                        : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                                                } whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm`}
                                            >
                                                Income Categories (
                                                {
                                                    categories.filter(
                                                        (c) =>
                                                            c.type === "income"
                                                    ).length
                                                }
                                                )
                                            </button>
                                        </nav>
                                    </div>

                                    {/* Category List */}
                                    <div className="min-h-[200px]">
                                        {categories.filter(
                                            (c) => c.type === activeTab
                                        ).length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="text-gray-400 mb-4">
                                                    {activeTab === "expense"
                                                        ? "📊"
                                                        : "💰"}{" "}
                                                    No {activeTab} categories
                                                    found
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        handleAddCategory(
                                                            activeTab
                                                        )
                                                    }
                                                    className={`${
                                                        activeTab === "expense"
                                                            ? "bg-red-600 hover:bg-red-700"
                                                            : "bg-green-600 hover:bg-green-700"
                                                    } text-white px-4 py-2 rounded-lg text-sm font-medium`}
                                                >
                                                    Create your first{" "}
                                                    {activeTab} category
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {categories
                                                    .filter(
                                                        (category) =>
                                                            category.type ===
                                                            activeTab
                                                    )
                                                    .map((category) => (
                                                        <div
                                                            key={category.id}
                                                            className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                        <span className="text-lg">
                                                                            {category.type ===
                                                                            "expense"
                                                                                ? "💸"
                                                                                : "💰"}
                                                                        </span>
                                                                        <h4 className="text-white font-medium text-lg">
                                                                            {
                                                                                category.name
                                                                            }
                                                                        </h4>
                                                                    </div>
                                                                    {category.description && (
                                                                        <p className="text-gray-400 text-sm line-clamp-2">
                                                                            {
                                                                                category.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex space-x-2 ml-4">
                                                                    <button
                                                                        onClick={() =>
                                                                            handleEditCategory(
                                                                                category
                                                                            )
                                                                        }
                                                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDeleteCategory(
                                                                                category.id
                                                                            )
                                                                        }
                                                                        className="text-red-400 hover:text-red-300 text-sm"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="pt-2 border-t border-gray-600">
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        category.type ===
                                                                        "expense"
                                                                            ? "bg-red-900 text-red-300"
                                                                            : "bg-green-900 text-green-300"
                                                                    }`}
                                                                >
                                                                    {category.type
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase() +
                                                                        category.type.slice(
                                                                            1
                                                                        )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category Form Modal */}
                    {showCategoryForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                                <div className="px-6 py-4 border-b border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-white">
                                            {editingCategory
                                                ? `Edit ${
                                                      editingCategory.type
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                      editingCategory.type.slice(
                                                          1
                                                      )
                                                  } Category`
                                                : `Add New ${
                                                      categoryFormData.type
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                      categoryFormData.type.slice(
                                                          1
                                                      )
                                                  } Category`}
                                        </h3>
                                        <button
                                            onClick={resetCategoryForm}
                                            className="text-gray-400 hover:text-gray-300 text-xl leading-none"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <form
                                    onSubmit={handleCategorySubmit}
                                    className="px-6 py-4 space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Category Name
                                        </label>
                                        <input
                                            type="text"
                                            value={categoryFormData.name}
                                            onChange={(e) =>
                                                setCategoryFormData({
                                                    ...categoryFormData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter category name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Description (Optional)
                                        </label>
                                        <textarea
                                            value={categoryFormData.description}
                                            onChange={(e) =>
                                                setCategoryFormData({
                                                    ...categoryFormData,
                                                    description: e.target.value,
                                                })
                                            }
                                            rows={3}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            placeholder="Describe this category (optional)"
                                        />
                                    </div>

                                    {!editingCategory && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                                Category Type
                                            </label>
                                            <div className="flex space-x-4">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value="expense"
                                                        checked={
                                                            categoryFormData.type ===
                                                            "expense"
                                                        }
                                                        onChange={(e) =>
                                                            setCategoryFormData(
                                                                {
                                                                    ...categoryFormData,
                                                                    type: "expense",
                                                                }
                                                            )
                                                        }
                                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                                                    />
                                                    <div className="ml-2">
                                                        <span className="text-sm font-medium text-white">
                                                            💸 Expense
                                                        </span>
                                                    </div>
                                                </label>
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="type"
                                                        value="income"
                                                        checked={
                                                            categoryFormData.type ===
                                                            "income"
                                                        }
                                                        onChange={(e) =>
                                                            setCategoryFormData(
                                                                {
                                                                    ...categoryFormData,
                                                                    type: "income",
                                                                }
                                                            )
                                                        }
                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                                    />
                                                    <div className="ml-2">
                                                        <span className="text-sm font-medium text-white">
                                                            💰 Income
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={resetCategoryForm}
                                            className="px-4 py-2 text-gray-400 hover:text-gray-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className={`px-4 py-2 rounded-lg font-medium text-white ${
                                                categoryFormData.type ===
                                                "expense"
                                                    ? "bg-red-600 hover:bg-red-700"
                                                    : "bg-green-600 hover:bg-green-700"
                                            }`}
                                        >
                                            {editingCategory
                                                ? "Update Category"
                                                : "Create Category"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Settings;
