import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Receipt,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCreditPersonaRecords,
  CreditPersonaRecordsData,
} from "../services/Credit/fetchCreditPersonaRecords";
import { createCreditRecord } from "../services/Credit/createCreditRecord";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { Order } from "../services/Order/fetchOrders";
import { OrderDetailModal } from "../components/Orders/OrderDetailModal";
import { useLanguage } from "../context/LanguageContext";

export const CreditDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Get credit person info from location state if available
  const personInfo = location.state as {
    name?: string;
    phone?: string;
  } | null;

  const [loading, setLoading] = useState(true);
  const [personaDetail, setPersonaDetail] =
    useState<CreditPersonaRecordsData | null>(null);
  const [personName, setPersonName] = useState(
    personInfo?.name || "Credit Person"
  );
  const [personPhone, setPersonPhone] = useState(personInfo?.phone || "");

  // Add Payment Modal State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    orderId: "",
    paidAmount: 0,
    paymentMethod: "cash",
  });

  // Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  useEffect(() => {
    if (id) {
      loadCreditDetail();
    }
  }, [id]);

  const loadCreditDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetchCreditPersonaRecords(id);
      if (response.success && response.data) {
        setPersonaDetail(response.data);
        setPersonName(response.data.creditPerson.name);
        setPersonPhone(response.data.creditPerson.phone);
      } else {
        toast.error(response.message || "Failed to load credit details");
      }
    } catch (error) {
      console.error("Error loading credit details:", error);
      toast.error("Failed to load credit details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Cash",
      kpay: "KBZ Pay",
      kbzpay: "KBZ Pay",
      wavepay: "Wave Pay",
      ayapay: "AYA Pay",
      uabpay: "UAB Pay",
      bank_transfer: "Bank Transfer",
    };
    return labels[method?.toLowerCase()] || method;
  };

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "kpay", label: "KBZ Pay" },
    { value: "wavepay", label: "Wave Pay" },
    { value: "ayapay", label: "AYA Pay" },
    { value: "uabpay", label: "UAB Pay" },
    { value: "bank_transfer", label: "Bank Transfer" },
  ];

  const handleOpenAddPayment = () => {
    // Default to first order if available
    const defaultOrderId = personaDetail?.orders[0]?._id || "";
    setPaymentForm({
      orderId: defaultOrderId,
      paidAmount: 0,
      paymentMethod: "cash",
    });
    setShowAddPaymentModal(true);
  };

  const handleCloseAddPayment = () => {
    setShowAddPaymentModal(false);
    setPaymentForm({ orderId: "", paidAmount: 0, paymentMethod: "cash" });
  };

  const handleAddPayment = async () => {
    if (!paymentForm.orderId) {
      toast.error(t("creditDetail.selectOrder"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createCreditRecord({
        orderId: paymentForm.orderId,
        paidAmount: paymentForm.paidAmount,
        paymentMethod: paymentForm.paymentMethod,
      });

      if (response.success) {
        toast.success(t("creditDetail.paymentRecorded"));
        handleCloseAddPayment();
        // Refresh the credit details
        await loadCreditDetail();
      } else {
        toast.error(response.message || t("creditDetail.failedToRecord"));
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(t("creditDetail.failedToRecord"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOrder = async (orderId: string) => {
    setLoadingOrderDetail(true);
    setSelectedOrder(null);
    try {
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      } else {
        toast.error(response.message || "Failed to load order details");
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/credits")}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            {personName}
          </h1>
          {personPhone && (
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
              <Phone className="w-4 h-4" />
              {personPhone}
            </p>
          )}
        </div>
        <button
          onClick={loadCreditDetail}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {t("creditDetail.refresh")}
        </button>
        {personaDetail && personaDetail.orders.length > 0 && (
          <button
            onClick={handleOpenAddPayment}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            {t("creditDetail.addPayment")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-slate-500">{t("creditDetail.loading")}</p>
        </div>
      ) : personaDetail ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    {t("creditDetail.totalRecords")}
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {personaDetail.summary.totalCreditRecords}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    {t("creditDetail.totalPaid")}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {personaDetail?.summary?.totalPaidViaCreditRecords?.toLocaleString()}{" "}
                    MMK
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    {t("creditDetail.outstanding")}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {personaDetail.summary.totalOutstandingAmount.toLocaleString()}{" "}
                    MMK
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Associated Orders */}
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            <div className="p-4 border-b bg-slate-50">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                {t("creditDetail.associatedOrders")} (
                {personaDetail.orders.length})
              </h2>
            </div>
            <div className="p-4">
              {personaDetail.orders.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  {t("creditDetail.noOrders")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {personaDetail.orders.map((order) => (
                    <button
                      key={order._id}
                      onClick={() => handleViewOrder(order._id)}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      {order.orderNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment Records */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                {t("creditDetail.paymentRecords")} (
                {personaDetail.creditRecords.count})
              </h2>
            </div>
            {personaDetail.creditRecords.records.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                {t("creditDetail.noRecords")}
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {t("creditDetail.order")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("creditDetail.paymentDate")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("common.method")}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t("creditDetail.orderAmount")}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t("creditDetail.amountPaid")}
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      {t("creditDetail.remaining")}
                    </th>
                    <th className="px-4 py-3 font-medium">
                      {t("common.notes")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {personaDetail.creditRecords.records.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="text-blue-600 font-medium">
                          {record.orderId.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(record.paymentDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                          {getPaymentMethodLabel(record.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {record.orderId.finalAmount.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        {record.paidAmount.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-medium ${
                            record.orderId.remainingBalance > 0
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {record.orderId.remainingBalance.toLocaleString()} MMK
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {record.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Failed to load credit details</p>
          <button
            onClick={loadCreditDetail}
            className="mt-4 px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/80 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center bg-green-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                {t("creditDetail.recordPayment")}
              </h2>
              <button
                onClick={handleCloseAddPayment}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Order Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("creditDetail.selectOrder")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={paymentForm.orderId}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, orderId: e.target.value })
                  }
                >
                  <option value="">
                    -- {t("creditDetail.selectOrder")} --
                  </option>
                  {personaDetail?.orders.map((order) => (
                    <option key={order._id} value={order._id}>
                      {order.orderNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("creditDetail.amount")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder={t("creditDetail.enterAmount")}
                  value={paymentForm.paidAmount || ""}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paidAmount: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("creditDetail.paymentMethod")}
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMethod: e.target.value,
                    })
                  }
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={handleCloseAddPayment}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleAddPayment}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />{" "}
                    {t("creditDetail.recordPayment")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!(selectedOrder || loadingOrderDetail)}
        loading={loadingOrderDetail}
        order={selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setLoadingOrderDetail(false);
        }}
      />
    </div>
  );
};
