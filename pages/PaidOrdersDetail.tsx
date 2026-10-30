import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  DollarSign,
  Loader2,
  Receipt,
  Search,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchPaidOrdersList,
  PaidOrdersListResponse,
} from "../services/Reports/fetchPaidOrdersList";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { Order } from "../services/Order/fetchOrders";
import { OrderDetailModal } from "../components/Orders/OrderDetailModal";
import {
  CreditReportHeader,
  SummaryCard,
  useCreditReportFilters,
} from "../components/Reports/CreditReportLayout";
import {
  formatCurrency,
  formatDisplayDate,
  PAYMENT_METHOD_COLORS,
} from "../components/Reports/reportUtils";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatMethodLabel = (method: string) =>
  method
    ? method
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "-";

export const PaidOrdersDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { date, dateStr, storefront, storefronts, updateParams } =
    useCreditReportFilters();
  const method = searchParams.get("method") || "";

  const [report, setReport] = useState<PaidOrdersListResponse["data"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadReport = async () => {
      setLoading(true);
      const response = await fetchPaidOrdersList(dateStr, dateStr, storefront);
      if (cancelled) return;
      if (response.success) {
        setReport(response.data);
      } else {
        setReport(null);
        toast.error(response.message || "Failed to load paid orders");
      }
      setLoading(false);
    };
    loadReport();
    return () => {
      cancelled = true;
    };
  }, [dateStr, storefront, reloadKey]);

  const orders = report?.orders || [];

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders
      .filter((order) => !method || order.paymentMethod === method)
      .filter(
        (order) => !term || order.orderNumber?.toLowerCase().includes(term),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orders, method, search]);

  const displayDate = formatDisplayDate(date);
  const showStorefrontColumn = storefront === "all";
  const showSoldByColumn = orders.some((order) => order.soldBy);

  const handleViewOrder = async (orderId: string) => {
    setLoadingDetail(true);
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
      setLoadingDetail(false);
    }
  };

  // After items are added/removed in the modal, refresh it and the list
  const handleOrderUpdate = async () => {
    setReloadKey((key) => key + 1);
    if (selectedOrder?._id) {
      const response = await fetchOrderById(selectedOrder._id);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      }
    }
  };

  const renderMethodBadge = (value: string) => {
    const color = PAYMENT_METHOD_COLORS[value] || "#64748b";
    return (
      <span
        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
        style={{ color, backgroundColor: `${color}1a` }}
      >
        {formatMethodLabel(value)}
      </span>
    );
  };

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
      active
        ? "bg-purple-600 text-white border-purple-600"
        : "bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-700"
    }`;

  const thClass = "px-2 sm:px-4 py-3 font-semibold text-slate-600";

  return (
    <div className="p-4 sm:p-6">
      <CreditReportHeader
        title="Paid Orders"
        subtitle={`Direct paid sales on ${displayDate}`}
        icon={DollarSign}
        iconClassName="text-purple-600"
        dateStr={dateStr}
        date={date}
        storefront={storefront}
        storefronts={storefronts}
        updateParams={updateParams}
      />

      {/* Summary cards (always the whole day, regardless of method filter) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <SummaryCard
          color="purple"
          icon={DollarSign}
          label="Net Received"
          value={
            loading || !report
              ? "-"
              : formatCurrency(report.totals.totalNetAmount)
          }
          caption={
            <span className="text-slate-500">
              Change given:{" "}
              {loading || !report
                ? "-"
                : formatCurrency(report.totals.totalExtraChange)}
            </span>
          }
        />
        <SummaryCard
          color="blue"
          icon={Receipt}
          label="Orders"
          value={loading || !report ? "-" : report.totals.orderCount}
          caption="Paid orders"
        />
        <SummaryCard
          color="green"
          icon={ShoppingBag}
          label="Sales Amount"
          value={
            loading || !report
              ? "-"
              : formatCurrency(report.totals.totalFinalAmount)
          }
          caption="Total of bills"
        />
      </div>

      {/* Payment method chips */}
      {!loading && report && report.paymentMethods.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          <button
            onClick={() => updateParams({ method: "" })}
            className={chipClass(!method)}
          >
            All
          </button>
          {report.paymentMethods.map((pm) => (
            <button
              key={pm.paymentMethod}
              onClick={() => updateParams({ method: pm.paymentMethod })}
              className={chipClass(method === pm.paymentMethod)}
            >
              {formatMethodLabel(pm.paymentMethod)} ·{" "}
              {formatCurrency(pm.totalNetAmount)}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-4">
        <span className="text-sm text-slate-500">
          {loading
            ? ""
            : `${filteredOrders.length} order${
                filteredOrders.length === 1 ? "" : "s"
              }`}
        </span>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order no."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
          />
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-slate-500">Loading paid orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No paid orders on {displayDate}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No orders match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className={thClass}>Time</th>
                  <th className={thClass}>Order no.</th>
                  {showStorefrontColumn && (
                    <th className={thClass}>Storefront</th>
                  )}
                  <th className={`${thClass} text-right`}>Items</th>
                  <th className={thClass}>Method</th>
                  <th className={`${thClass} text-right`}>Bill</th>
                  <th className={`${thClass} text-right`}>Received</th>
                  <th className={`${thClass} text-right`}>Change</th>
                  <th className={`${thClass} text-right`}>Net</th>
                  {showSoldByColumn && <th className={thClass}>Sold by</th>}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => handleViewOrder(order._id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleViewOrder(order._id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="hover:bg-slate-50 cursor-pointer focus:outline-none focus-visible:bg-slate-50"
                  >
                    <td
                      className="px-2 sm:px-4 py-3 text-slate-600 whitespace-nowrap"
                      title={formatDateTime(order.createdAt)}
                    >
                      {formatTime(order.createdAt)}
                    </td>
                    <td className="px-2 sm:px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {order.orderNumber || "-"}
                    </td>
                    {showStorefrontColumn && (
                      <td className="px-2 sm:px-4 py-3 text-slate-600">
                        {order.storefront?.locationName || "-"}
                      </td>
                    )}
                    <td className="px-2 sm:px-4 py-3 text-right text-slate-600">
                      {order.itemCount}
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      {renderMethodBadge(order.paymentMethod)}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                      {formatCurrency(order.finalAmount || 0)}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                      {formatCurrency(order.paidAmount || 0)}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                      {order.extraChange ? (
                        formatCurrency(order.extraChange)
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-right font-bold text-purple-700 whitespace-nowrap">
                      {formatCurrency(order.netAmount || 0)}
                    </td>
                    {showSoldByColumn && (
                      <td className="px-2 sm:px-4 py-3 text-slate-600">
                        {order.soldBy?.name || "-"}
                      </td>
                    )}
                    <td className="pr-2 sm:pr-4 py-3">
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderDetailModal
        isOpen={!!selectedOrder || loadingDetail}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        loading={loadingDetail}
        onOrderUpdate={handleOrderUpdate}
      />
    </div>
  );
};
