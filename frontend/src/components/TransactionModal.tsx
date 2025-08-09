import React, { useState, useEffect } from "react";
import { type Currency, currencyNames } from "../utils/currency";

interface Account {
    id: number;
    name: string;
    type: string;
    currency: Currency;
}

interface Category {
    id: number;
    name: string;
    type: "expense" | "income";
}

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (transaction: TransactionFormData) => Promise<void>;
    transactionType?: "income" | "expense";
    editTransaction?: any;
}

export interface TransactionFormData {
    account_id: number;
    amount: number;
    description: string;
    category: string;
    type: "income" | "expense";
    currency: Currency;
    date: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    transactionType,
    editTransaction,
}) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<TransactionFormData>({
        account_id: 0,
        amount: 0,
        description: "",
        category: "",
        type: transactionType || "expense",
        currency: "RSD",
        date: new Date().toISOString().split("T")[0],
    });

    // Fetch accounts and categories on mount
    useEffect(() => {
        if (isOpen) {
            fetchAccounts();
            fetchCategories();
        }
    }, [isOpen]);

    // Set form data for editing
    useEffect(() => {
        if (editTransaction) {
            setFormData({
                account_id: editTransaction.account_id,
                amount: editTransaction.amount,
                description: editTransaction.description || "",
                category: editTransaction.category || "",
                type: editTransaction.type,
                currency: editTransaction.currency,
                date: new Date(editTransaction.date)
                    .toISOString()
                    .split("T")[0],
            });
        } else {
            // Reset form for new transaction
            setFormData({
                account_id: 0,
                amount: 0,
                description: "",
                category: "",
                type: transactionType || "expense",
                currency: "RSD",
                date: new Date().toISOString().split("T")[0],
            });
        }
    }, [editTransaction, transactionType, isOpen]);

    const fetchAccounts = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:3001/api/accounts", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAccounts(data);

                // Set first account as default if none selected
                if (data.length > 0 && formData.account_id === 0) {
                    setFormData((prev) => ({
                        ...prev,
                        account_id: data[0].id,
                    }));
                }
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem("token");
            const type = transactionType || formData.type;
            const response = await fetch(
                `http://localhost:3001/api/categories?type=${type}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    // Refetch categories when transaction type changes
    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [formData.type, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.account_id || formData.amount <= 0) {
            alert("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error("Error submitting transaction:", error);
            alert("Failed to save transaction. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (
        field: keyof TransactionFormData,
        value: any
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700">
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white">
                            {editTransaction
                                ? "Edit Transaction"
                                : "Add Transaction"}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Transaction Type (only show if not preset) */}
                    {!transactionType && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Transaction Type *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleInputChange("type", "expense")
                                    }
                                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                                        formData.type === "expense"
                                            ? "bg-red-600 border-red-500 text-white"
                                            : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                                    }`}
                                >
                                    💸 Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleInputChange("type", "income")
                                    }
                                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                                        formData.type === "income"
                                            ? "bg-green-600 border-green-500 text-white"
                                            : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                                    }`}
                                >
                                    💰 Income
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Account Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Account *
                        </label>
                        <select
                            value={formData.account_id}
                            onChange={(e) =>
                                handleInputChange(
                                    "account_id",
                                    parseInt(e.target.value)
                                )
                            }
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value={0}>Select an account</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} ({account.currency})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount and Currency */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Amount *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={formData.amount || ""}
                                onChange={(e) =>
                                    handleInputChange(
                                        "amount",
                                        parseFloat(e.target.value) || 0
                                    )
                                }
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Currency *
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) =>
                                    handleInputChange(
                                        "currency",
                                        e.target.value as Currency
                                    )
                                }
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                {Object.entries(currencyNames).map(
                                    ([code, name]) => (
                                        <option key={code} value={code}>
                                            {code}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) =>
                                handleInputChange("description", e.target.value)
                            }
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="What was this transaction for?"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) =>
                                handleInputChange("category", e.target.value)
                            }
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">No category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {categories.length === 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                                No {formData.type} categories found. Add some in
                                Settings.
                            </p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Date *
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                                handleInputChange("date", e.target.value)
                            }
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                                formData.type === "income"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading
                                ? "Saving..."
                                : editTransaction
                                ? "Update"
                                : "Add"}{" "}
                            {formData.type === "income" ? "Income" : "Expense"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;
