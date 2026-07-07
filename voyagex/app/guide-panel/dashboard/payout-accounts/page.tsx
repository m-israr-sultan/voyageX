"use client";

import { useEffect, useState } from "react";
import {
  FaSpinner,
  FaPlus,
  FaTrash,
  FaStar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaMobileAlt,
  FaUniversity,
  FaEdit,
} from "react-icons/fa";
import { guideFinancialApi } from "@/lib/api";

type PayoutProvider = "EASYPAISA" | "JAZZCASH" | "BANK_ACCOUNT";

interface PayoutAccount {
  id: string;
  provider: PayoutProvider;
  accountTitle: string;
  mobileNumber?: string | null;
  iban?: string | null;
  bankName?: string | null;
  isDefault: boolean;
  verified: boolean;
  accountStatus: string;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
}

const PROVIDER_LABELS: Record<PayoutProvider, string> = {
  EASYPAISA: "EasyPaisa",
  JAZZCASH: "JazzCash",
  BANK_ACCOUNT: "Bank Account",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  PENDING_VERIFICATION: "bg-yellow-50 text-yellow-700",
  REJECTED: "bg-red-50 text-red-700",
  SUSPENDED: "bg-gray-100 text-gray-600",
};

export default function PayoutAccountsPage() {
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    provider: "EASYPAISA" as PayoutProvider,
    accountTitle: "",
    mobileNumber: "",
    iban: "",
    bankName: "",
    isDefault: false,
  });

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await guideFinancialApi.listPayoutAccounts();
      const result = response.data;
      if (result.success) {
        setAccounts(result.data || []);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Failed to load payout accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const resetForm = () => {
    setForm({
      provider: "EASYPAISA",
      accountTitle: "",
      mobileNumber: "",
      iban: "",
      bankName: "",
      isDefault: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("form");
    setError(null);
    try {
      const payload = {
        provider: form.provider,
        accountTitle: form.accountTitle.trim(),
        isDefault: form.isDefault,
        ...(form.provider !== "BANK_ACCOUNT" && { mobileNumber: form.mobileNumber.trim() }),
        ...(form.provider === "BANK_ACCOUNT" && {
          iban: form.iban.trim(),
          bankName: form.bankName.trim(),
        }),
      };

      if (editingId) {
        await guideFinancialApi.updatePayoutAccount(editingId, payload);
        setSuccess("Payout account updated. Awaiting admin verification.");
      } else {
        await guideFinancialApi.createPayoutAccount(payload);
        setSuccess("Payout account added. Awaiting admin verification.");
      }
      resetForm();
      await fetchAccounts();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Failed to save payout account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (account: PayoutAccount) => {
    setEditingId(account.id);
    setForm({
      provider: account.provider,
      accountTitle: account.accountTitle,
      mobileNumber: account.mobileNumber || "",
      iban: account.iban || "",
      bankName: account.bankName || "",
      isDefault: account.isDefault,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payout account?")) return;
    setActionLoading(id);
    try {
      await guideFinancialApi.deletePayoutAccount(id);
      setSuccess("Payout account deleted.");
      await fetchAccounts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Failed to delete account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setActionLoading(id);
    try {
      await guideFinancialApi.setDefaultPayoutAccount(id);
      setSuccess("Default payout account updated.");
      await fetchAccounts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Failed to set default account");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FaSpinner className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Payout Accounts</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Register where your tour earnings are sent after escrow release
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#008A1E] text-white text-sm rounded-lg hover:bg-[#006d17]"
        >
          <FaPlus className="w-3.5 h-3.5" /> Add Account
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <FaExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <FaCheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            {editingId ? "Edit Payout Account" : "Add Payout Account"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Provider</label>
                <select
                  value={form.provider}
                  disabled={!!editingId}
                  onChange={(e) => setForm({ ...form, provider: e.target.value as PayoutProvider })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="EASYPAISA">EasyPaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="BANK_ACCOUNT">Bank Account</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Account Title</label>
                <input
                  required
                  value={form.accountTitle}
                  onChange={(e) => setForm({ ...form, accountTitle: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Account holder name"
                />
              </div>
            </div>

            {form.provider !== "BANK_ACCOUNT" ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number</label>
                <input
                  required
                  value={form.mobileNumber}
                  onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="03XXXXXXXXX"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">IBAN</label>
                  <input
                    required
                    value={form.iban}
                    onChange={(e) => setForm({ ...form, iban: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="PK00XXXX..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
                  <input
                    required
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Set as default payout account
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={actionLoading === "form"}
                className="px-4 py-2 bg-[#008A1E] text-white text-sm rounded-lg hover:bg-[#006d17] disabled:opacity-50"
              >
                {actionLoading === "form" ? "Saving..." : editingId ? "Update" : "Add Account"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <FaMobileAlt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No payout accounts yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Add an EasyPaisa, JazzCash, or bank account to receive automatic payouts
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-white rounded-xl border p-5 shadow-sm ${
                account.isDefault ? "border-[#008A1E]" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {account.provider === "BANK_ACCOUNT" ? (
                    <FaUniversity className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FaMobileAlt className="w-5 h-5 text-green-600" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{PROVIDER_LABELS[account.provider]}</p>
                    <p className="text-sm text-gray-500">{account.accountTitle}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[account.accountStatus] || "bg-gray-100 text-gray-600"}`}>
                  {account.accountStatus.replace(/_/g, " ")}
                </span>
              </div>

              <div className="mt-3 text-xs text-gray-500 space-y-1">
                {account.mobileNumber && <p>Mobile: {account.mobileNumber}</p>}
                {account.iban && <p>IBAN: {account.iban}</p>}
                {account.bankName && <p>Bank: {account.bankName}</p>}
                {account.rejectionReason && (
                  <p className="text-red-600">Rejected: {account.rejectionReason}</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {account.isDefault && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#008A1E] bg-green-50 px-2 py-1 rounded-full">
                    <FaStar className="w-3 h-3" /> Default
                  </span>
                )}
                {account.accountStatus === "ACTIVE" && !account.isDefault && (
                  <button
                    onClick={() => handleSetDefault(account.id)}
                    disabled={actionLoading === account.id}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleEdit(account)}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1"
                >
                  <FaEdit className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  disabled={actionLoading === account.id}
                  className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 inline-flex items-center gap-1"
                >
                  <FaTrash className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <FaCheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Verification Required</h4>
            <p className="text-xs text-blue-700 mt-1">
              New and updated accounts require admin approval before they can receive payouts.
              Only one verified default account is used for automatic transfers after escrow release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
