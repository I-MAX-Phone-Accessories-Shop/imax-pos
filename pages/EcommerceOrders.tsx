import React, { useEffect, useMemo, useState } from "react";
import { Receipt, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import {
  EcommerceOrder,
  EcommerceOrderPagination,
  EcommerceOrderStatus,
  fetchEcommerceOrders,
} from "../services/Ecommerce/fetchEcommerceOrders";
import { updateEcommerceOrderStatus } from "../services/Ecommerce/updateEcommerceOrderStatus";
import { EcommerceOrderDetailModal } from "../components/Ecommerce/EcommerceOrderDetailModal";
import { fetchEcommerceOrderById } from "../services/Ecommerce/fetchEcommerceOrderById";
import { ConfirmModal } from "../components/Common/ConfirmModal";
import { DateRangePicker } from "../components/Reports/DateRangePicker";

type StatusFilter = EcommerceOrderStatus | "all";

// Helper function to get today's date
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStatusBadge = (status: EcommerceOrderStatus) => {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-emerald-100 text-emerald-800";
    case "cancelled":
    default:
      return "bg-rose-100 text-rose-800";
  }
};

const getNextStatuses = (current: EcommerceOrderStatus): EcommerceOrderStatus[] => {
  const chain: EcommerceOrderStatus[] = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
  ];
  // Always allow cancelled
  const next: EcommerceOrderStatus[] = ["cancelled"];
  const idx = chain.indexOf(current);
  if (idx >= 0 && idx < chain.length - 1) {
    next.push(chain[idx + 1]);
  }
  return Array.from(new Set(next));
};

export const EcommerceOrders: React.FC = () => {
  const { t } = useLanguage();

  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [pagination, setPagination] = useState<EcommerceOrderPagination | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  // Initialize dates to today (same as Orders page)
  const [startDate, setStartDate] = useState<Date | null>(getToday());
  const [endDate, setEndDate] = useState<Date | null>(getToday());
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [selectedOrder, setSelectedOrder] = useState<EcommerceOrder | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    order: EcommerceOrder;
    nextStatus: EcommerceOrderStatus;
  } | null>(null);

  const totalItems = pagination?.totalItems ?? orders.length;

  useEffect(() => {
    setPage(1);
  }, [status, search, startDate, endDate]);

  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, search, startDate, endDate]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchEcommerceOrders({
        page,
        limit,
        status,
        search: search.trim() || undefined,
        startDate: startDateStr || undefined,
        endDate: endDateStr || undefined,
      });

      if (response.success) {
        setOrders(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          setPagination({
            currentPage: page,
            totalPages: 1,
            totalItems: response.data.length,
            itemsPerPage: response.data.length,
          });
        }
      } else {
        setOrders([]);
        setPagination(null);
        toast.error(response.message || t("ecommerceOrders.failedToLoad"));
      }
    } catch (error) {
      console.error("Error fetching ecommerce orders:", error);
      toast.error(t("ecommerceOrders.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (order: EcommerceOrder) => {
    setDetailOpen(true);
    setLoadingDetail(true);
    setSelectedOrder(order);
    try {
      const response = await fetchEcommerceOrderById(order._id);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      } else {
        toast.error(response.message || t("ecommerceOrders.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading ecommerce order detail:", error);
      toast.error(t("ecommerceOrders.failedToLoad"));
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshSelectedOrder = async () => {
    if (!selectedOrder?._id) return;
    setLoadingDetail(true);
    try {
      const response = await fetchEcommerceOrderById(selectedOrder._id);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      }
    } catch (error) {
      console.error("Error refreshing ecommerce order detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const doUpdateStatus = async (
    order: EcommerceOrder,
    nextStatus: EcommerceOrderStatus,
  ) => {
    setUpdatingStatusId(order._id);
    try {
      const response = await updateEcommerceOrderStatus(order._id, {
        status: nextStatus,
      });
      if (response.success) {
        toast.success(t("ecommerceOrders.updateStatus.success"));
        await loadOrders();
        if (selectedOrder?._id === order._id) {
          await refreshSelectedOrder();
        }
      } else {
        toast.error(
          response.message || t("ecommerceOrders.updateStatus.failed"),
        );
      }
    } catch (error) {
      console.error("Error updating ecommerce order status:", error);
      toast.error(t("ecommerceOrders.updateStatus.failed"));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const statusOptions: { value: StatusFilter; label: string }[] = useMemo(
    () => [
      { value: "all", label: t("ecommerceOrders.statusFilterAll") },
      {
        value: "pending",
        label: t("ecommerceOrders.statusLabelsMm.pending"),
      },
      {
        value: "confirmed",
        label: t("ecommerceOrders.statusLabelsMm.confirmed"),
      },
      {
        value: "shipped",
        label: t("ecommerceOrders.statusLabelsMm.shipped"),
      },
      {
        value: "delivered",
        label: t("ecommerceOrders.statusLabelsMm.delivered"),
      },
      {
        value: "cancelled",
        label: t("ecommerceOrders.statusLabelsMm.cancelled"),
      },
    ],
    [t],
  );

  const handleDateChange = (
    newStartDate: Date | null,
    newEndDate: Date | null,
  ) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handlePageChange = (nextPage: number) => {
    if (!pagination) return;
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setPage(nextPage);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            {t("ecommerceOrders.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("ecommerceOrders.subtitle")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-slate-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-700 disabled:opacity-50 text-sm sm:text-base"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span>{t("common.refresh")}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            {t("common.search")}
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("ecommerceOrders.searchPlaceholder")}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
          />
        </div>

        <div className="w-full sm:w-48">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            {t("ecommerceOrders.status")}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary bg-white"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full lg:w-auto">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            {t("common.date")}
          </label>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex justify-between items-center mb-2 text-xs text-slate-500">
        <span>
          {t("ecommerceOrders.totalItemsMmLabel").replace(
            "{count}",
            totalItems.toString(),
          )}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                #
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                {t("ecommerceOrders.orderNumber")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                {t("ecommerceOrders.customer")}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                {t("ecommerceOrders.total")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                {t("ecommerceOrders.status")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                {t("ecommerceOrders.payment")}
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                {t("ecommerceOrders.date")}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                {t("ecommerceOrders.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  {t("common.loading")}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  {t("ecommerceOrders.failedToLoad")}
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const displayIndex =
                  ((pagination?.currentPage ?? 1) - 1) *
                    (pagination?.itemsPerPage ?? limit) +
                  index +
                  1;

                const statusLabelMm =
                  t(`ecommerceOrders.statusLabelsMm.${order.status}`) ||
                  t(`ecommerceOrders.statusLabels.${order.status}`);

                const paymentLabel =
                  t(
                    `ecommerceOrders.paymentMethods.${order.paymentMethod}`,
                  ) || order.paymentMethod;

                const nextStatuses = getNextStatuses(order.status);

                return (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {displayIndex}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.customerId?.name || "-"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {order.customerId?.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-semibold">
                      {order.totalAmount.toLocaleString()} MMK
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${formatStatusBadge(
                          order.status,
                        )}`}
                      >
                        {statusLabelMm}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-col">
                        <span>{paymentLabel}</span>
                        <span className="text-xs text-slate-500">
                          {order.paymentStatus === "paid"
                            ? t("common.paid")
                            : t("common.remaining")}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-col sm:flex-row gap-1 justify-end">
                        <button
                          onClick={() => handleOpenDetail(order)}
                          className="px-2 py-1 text-xs rounded border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          {t("ecommerceOrders.view")}
                        </button>

                        <div className="inline-flex items-center gap-1">
                          <select
                            className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                            disabled={updatingStatusId === order._id}
                            defaultValue=""
                            onChange={(e) => {
                              const value = e.target.value as EcommerceOrderStatus;
                              e.target.value = "";
                              if (!value) return;
                              setPendingStatusChange({ order, nextStatus: value });
                              setConfirmStatusOpen(true);
                            }}
                          >
                            <option value="">
                              {t("ecommerceOrders.updateStatus.title")}
                            </option>
                            {nextStatuses.map((s) => (
                              <option key={s} value={s}>
                                {t(`ecommerceOrders.statusLabelsMm.${s}`)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-2 text-xs text-slate-600">
          <div>
            {t("orders.paginationSummary")
              .replace("{page}", pagination.currentPage.toString())
              .replace("{totalPages}", pagination.totalPages.toString())
              .replace("{totalItems}", pagination.totalItems.toString())}
          </div>
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 rounded border border-slate-200 bg-white text-xs disabled:opacity-50"
            >
              {t("common.previous")}
            </button>
            <span>
              {t("orders.page")} {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1 rounded border border-slate-200 bg-white text-xs disabled:opacity-50"
            >
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      <EcommerceOrderDetailModal
        isOpen={detailOpen}
        loading={loadingDetail}
        order={selectedOrder}
        onOrderUpdate={async () => {
          await loadOrders();
          await refreshSelectedOrder();
        }}
        onClose={() => {
          setDetailOpen(false);
          setSelectedOrder(null);
        }}
      />

      <ConfirmModal
        isOpen={confirmStatusOpen && !!pendingStatusChange}
        title={t("ecommerceOrders.updateStatus.title")}
        message={(() => {
          if (!pendingStatusChange) return "";
          const label =
            t(`ecommerceOrders.statusLabelsMm.${pendingStatusChange.nextStatus}`) ||
            t(`ecommerceOrders.statusLabels.${pendingStatusChange.nextStatus}`);
          return t("ecommerceOrders.updateStatus.confirmMessage").replace(
            "{status}",
            label,
          );
        })()}
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        confirmButtonColor="primary"
        isLoading={
          !!pendingStatusChange &&
          updatingStatusId === pendingStatusChange.order._id
        }
        onCancel={() => {
          setConfirmStatusOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={async () => {
          if (!pendingStatusChange) return;
          const { order, nextStatus } = pendingStatusChange;
          await doUpdateStatus(order, nextStatus);
          setConfirmStatusOpen(false);
          setPendingStatusChange(null);
        }}
      />
    </div>
  );
};

