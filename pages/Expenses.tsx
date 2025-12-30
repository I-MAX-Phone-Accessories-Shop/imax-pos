import React, { useState, useEffect } from "react";
import {
  PieChart,
  RefreshCw,
  MapPin,
  User,
  Calendar,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { fetchExpenses, Expense } from "../services/Expense/fetchExpenses";
import { createExpense } from "../services/Expense/createExpense";
import { useLanguage } from "../context/LanguageContext";

export const Expenses: React.FC = () => {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "electricity",
    amount: 0,
    date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
    notes: "",
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetchExpenses();
      if (response.success && response.data) {
        setExpenses(response.data);
      } else {
        toast.error(response.message || t("expenses.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast.error(t("expenses.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || formData.amount <= 0 || !formData.date) {
      toast.error(t("expenses.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        category: formData.category,
        amount: formData.amount,
        date: formData.date,
        ...(formData.notes && { notes: formData.notes }),
      };

      const response = await createExpense(payload);

      if (response.success) {
        toast.success(t("expenses.expenseCreated"));
        setIsModalOpen(false);
        // Reset form
        setFormData({
          category: "electricity",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
          notes: "",
    });
        // Refresh expenses list
        loadExpenses();
      } else {
        toast.error(response.message || t("expenses.failedToCreate"));
      }
    } catch (error: any) {
      console.error("Error creating expense:", error);
      toast.error(error.message || t("expenses.failedToCreate"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <PieChart className="w-7 h-7 text-primary" />
          {t("expenses.title")}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> {t("expenses.addExpense")}
          </button>
          <button
            onClick={loadExpenses}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <PieChart className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{t("expenses.totalExpenses")}</p>
            <p className="text-2xl font-bold text-slate-800">
              {totalExpenses.toLocaleString()} MMK
            </p>
          </div>
        </div>
      </div>

        <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p>{t("expenses.loading")}</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>{t("expenses.noExpenses")}</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">{t("expenses.date")}</th>
                <th className="px-4 py-3 font-semibold text-slate-600">
                  {t("expenses.category")}
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600">
                  {t("expenses.location")}
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600">
                  {t("expenses.notes")}
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600">
                  {t("expenses.recordedBy")}
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">
                  {t("expenses.amount")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {formatDate(expense.date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium capitalize">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {expense.locationId ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-800">
                            {expense.locationId.locationName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {expense.locationId.locationCode}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">
                        {t("expenses.noLocation")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600">
                      {expense.notes || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {expense.adminId ? (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-800">
                            {expense.adminId.name}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">
                            {expense.adminId.role}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    {expense.amount.toLocaleString()} MMK
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                {t("expenses.newExpense")}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("expenses.category")} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="electricity">{t("expenses.electricity")}</option>
                  <option value="water">{t("expenses.water")}</option>
                  <option value="utilities">{t("expenses.utilities")}</option>
                  <option value="salary">{t("expenses.salary")}</option>
                  <option value="maintenance">{t("expenses.maintenance")}</option>
                  <option value="rent">{t("expenses.rent")}</option>
                  <option value="other">{t("expenses.other")}</option>
                </select>
              </div>

          <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("expenses.amount")} (MMK) <span className="text-red-500">*</span>
            </label>
            <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="0"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: Number(e.target.value),
                    })
                  }
            />
          </div>

          <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("expenses.date")} <span className="text-red-500">*</span>
            </label>
            <input
                  type="date"
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={formData.date}
              onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>

          <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("expenses.notesOptional")}
            </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder={t("expenses.notesPlaceholder")}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
          <button
            type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t("expenses.creating")}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> {t("expenses.createExpense")}
                    </>
                  )}
          </button>
              </div>
        </form>
      </div>
        </div>
      )}
    </div>
  );
};
