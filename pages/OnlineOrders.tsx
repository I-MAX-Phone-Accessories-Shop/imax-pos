import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  ShoppingBag,
  Search,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import {
  OnlineOrder,
  fetchOnlineOrders,
} from "../services/OnlineStorefront/fetchOnlineOrders";
import { updateOnlineOrderStatus } from "../services/OnlineStorefront/onlineOrderManagement";
import { OnlineOrderDetailModal } from "../components/OnlineOrders/OnlineOrderDetailModal";

export const OnlineOrders: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await fetchOnlineOrders(statusFilter, search);
      if (response.success) {
        setOrders(response.data);
        // If a modal is open for a specific order, update its data too
        if (selectedOrder) {
          const updatedOrder = response.data.find(
            (o) => o._id === selectedOrder._id,
          );
          if (updatedOrder) {
            setSelectedOrder(updatedOrder);
          }
        }
      } else {
        toast.error(t("onlineOrders.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading online orders:", error);
      toast.error(t("onlineOrders.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const response = await updateOnlineOrderStatus(orderId, newStatus);
      if (response.success) {
        toast.success(t("onlineOrders.statusUpdated"));
        loadOrders();
      } else {
        toast.error(t("onlineOrders.failedToUpdate"));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(t("onlineOrders.failedToUpdate"));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-indigo-500" />;
      case "delivered":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "shipped":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            {t("onlineOrders.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("onlineOrders.subtitle")}
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>{t("common.refresh")}</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t("onlineOrders.search")}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadOrders()}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "all",
              "pending",
              "confirmed",
              "shipped",
              "delivered",
              "cancelled",
            ].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === status
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status === "all"
                  ? t("common.all")
                  : t(`onlineOrders.${status}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t("onlineOrders.orderNumber")}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t("onlineOrders.customer")}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t("onlineOrders.total")}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t("onlineOrders.status")}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t("onlineOrders.date")}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                  {t("onlineOrders.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-slate-500 animate-pulse">
                        {t("onlineOrders.loading")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingBag className="w-12 h-12 text-slate-200" />
                      <p className="text-slate-400 font-medium">
                        {t("onlineOrders.noOrders")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-primary">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          {order.customerName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {order.customerPhone}
                        </span>
                        <span
                          className="text-xs text-slate-400 truncate max-w-[200px]"
                          title={order.customerAddress}
                        >
                          {order.customerAddress}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">
                        {order.finalAmount.toLocaleString()} MMK
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {order.ordersProducts.length} {t("onlineOrders.items")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(order.orderStatus)}`}
                      >
                        {getStatusIcon(order.orderStatus)}
                        {t(`onlineOrders.${order.orderStatus}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                      <div className="text-[10px]">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="relative group">
                          <button
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 flex items-center gap-1"
                            disabled={updatingStatus === order._id}
                          >
                            <span className="text-xs font-medium text-slate-600">
                              {updatingStatus === order._id
                                ? "..."
                                : t("onlineOrders.updateStatus")}
                            </span>
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          </button>

                          <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-1">
                            {[
                              "pending",
                              "confirmed",
                              "shipped",
                              "delivered",
                              "cancelled",
                            ].map((status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  handleStatusUpdate(order._id, status)
                                }
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                                  order.orderStatus === status
                                    ? "text-primary bg-primary/5"
                                    : "text-slate-600"
                                }`}
                              >
                                {getStatusIcon(status)}
                                {t(`onlineOrders.${status}`)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-primary border border-slate-200 shadow-sm"
                          title={t("onlineOrders.view")}
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Online Order Detail Modal */}
      <OnlineOrderDetailModal
        isOpen={isModalOpen}
        order={selectedOrder}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        onOrderUpdate={loadOrders}
      />
    </div>
  );
};
