import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Receipt,
  User,
  CreditCard,
  UserPlus,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { fetchCreditOrders } from "../services/Order/fetchCreditOrders";
import { Order } from "../services/Order/fetchOrders";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { assignCreditPerson } from "../services/Order/assignCreditPerson";
import { CreditOrdersFilters } from "../components/Orders/CreditOrdersFilters";
import { OrderDetailModal } from "../components/Orders/OrderDetailModal";
import { CreditPersonModal } from "../components/Orders/CreditPersonModal";
import { useLanguage } from "../context/LanguageContext";
import { DateRangePicker } from "../components/Reports/DateRangePicker";

// Helper function to get today's date
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const CreditOrders: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] =
    useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [showCreditPersonModal, setShowCreditPersonModal] = useState(false);
  const [selectedOrderForCredit, setSelectedOrderForCredit] =
    useState<Order | null>(null);
  const [assigningCreditPerson, setAssigningCreditPerson] = useState(false);

  // Initialize dates to today
  const [startDate, setStartDate] = useState<Date | null>(getToday());
  const [endDate, setEndDate] = useState<Date | null>(getToday());

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStorefrontId, startDate, endDate, paymentMethodFilter]);

  const loadInitialData = async () => {
    // Load storefronts and credit personas
    try {
      const [sfResponse, cpResponse] = await Promise.all([
        fetchStorefrontProfiles(),
        fetchCreditPersonas(),
      ]);

      if (sfResponse.success && sfResponse.data) {
        setStorefronts(sfResponse.data.reverse());
      }

      if (cpResponse.success && cpResponse.data) {
        setCreditPersonas(cpResponse.data);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);

      const response = await fetchCreditOrders(
        startDateStr,
        endDateStr,
        paymentMethodFilter === "all" ? null : paymentMethodFilter,
      );

      if (response.success && response.data) {
        let filteredOrders = response.data;

        // If a specific storefront is selected, filter results
        if (selectedStorefrontId !== "all") {
          filteredOrders = response.data.filter(
            (order) =>
              order.storefrontId?._id === selectedStorefrontId ||
              order.storefrontId?.id === selectedStorefrontId,
          );
        }

        setOrders(filteredOrders);
      } else {
        toast.error(response.message || t("orders.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading credit orders:", error);
      toast.error(t("orders.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      order.storefrontId?.locationName
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      (order.creditPersonId &&
        typeof order.creditPersonId === "object" &&
        order.creditPersonId.name
          ?.toLowerCase()
          .includes(search.toLowerCase()));

    return matchesSearch;
  });

  const handleViewOrder = async (orderId: string) => {
    setLoadingDetail(true);
    setSelectedOrder(null);
    try {
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      } else {
        toast.error(response.message || t("orders.failedToLoadDetails"));
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error(t("orders.failedToLoadDetails"));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRefreshOrderDetails = async () => {
    if (selectedOrder?._id) {
      setLoadingDetail(true);
      try {
        const response = await fetchOrderById(selectedOrder._id);
        if (response.success && response.data) {
          setSelectedOrder(response.data);
        }
      } catch (error) {
        console.error("Error refreshing order details:", error);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleOpenCreditPersonModal = (order: Order) => {
    setSelectedOrderForCredit(order);
    setShowCreditPersonModal(true);
  };

  const handleAssignCreditPerson = async (creditPersonId: string) => {
    if (!selectedOrderForCredit) return;

    setAssigningCreditPerson(true);
    try {
      const response = await assignCreditPerson(
        selectedOrderForCredit._id,
        creditPersonId,
      );
      if (response.success) {
        toast.success("Credit person assigned successfully");
        setShowCreditPersonModal(false);
        setSelectedOrderForCredit(null);
        // Refresh orders
        await loadOrders();
      } else {
        toast.error(response.message || "Failed to assign credit person");
      }
    } catch (error) {
      console.error("Error assigning credit person:", error);
      toast.error("Failed to assign credit person");
    } finally {
      setAssigningCreditPerson(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MMK",
    }).format(amount);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600" />
            Credit Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage credit sales and track customer balances
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(newStartDate, newEndDate) => {
              setStartDate(newStartDate);
              setEndDate(newEndDate);
            }}
          />
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">↻</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <CreditOrdersFilters
        search={search}
        onSearchChange={setSearch}
        storefronts={storefronts}
        selectedStorefrontId={selectedStorefrontId}
        onStorefrontChange={setSelectedStorefrontId}
        paymentMethodFilter={paymentMethodFilter}
        onPaymentMethodChange={setPaymentMethodFilter}
        orders={orders}
        filteredOrders={filteredOrders}
      />

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p>Loading credit orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No credit orders found</p>
          </div>
        ) : (
          <div>
            {/* Mobile scroll indicator */}
            <div className="sm:hidden px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center">
              ← Swipe to see more →
            </div>

            {/* Table container with horizontal scroll on mobile */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[1000px]">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">Order Number</span>
                      <span className="sm:hidden">Order #</span>
                    </th>

                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">Storefront</span>
                      <span className="sm:hidden">SF</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">Customer</span>
                      <span className="sm:hidden">Customer</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">Items</span>
                      <span className="sm:hidden">Items</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">Total</span>
                      <span className="sm:hidden">Total</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">Paid</span>
                      <span className="sm:hidden">Paid</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">Remaining</span>
                      <span className="sm:hidden">Balance</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">Actions</span>
                      <span className="sm:hidden">A</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="px-2 sm:px-4 py-3">
                        <div className="font-medium text-slate-800 text-xs sm:text-sm">
                          {order.orderNumber}
                        </div>
                      </td>

                      <td className="px-2 sm:px-4 py-3">
                        <div className="font-medium text-slate-800 text-xs sm:text-sm">
                          <div
                            className="truncate"
                            title={
                              order.storefrontId?.locationName ||
                              order.storefrontId?.storefrontName
                            }
                          >
                            {order.storefrontId?.locationName ||
                              order.storefrontId?.storefrontName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {order.storefrontId?.locationCode ||
                              order.storefrontId?.storefrontCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        {order.creditPersonId &&
                        typeof order.creditPersonId === "object" ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div
                                className="font-medium text-slate-800 text-xs sm:text-sm truncate"
                                title={order.creditPersonId.name}
                              >
                                {order.creditPersonId.name}
                              </div>
                              <div
                                className="text-xs text-slate-500 truncate"
                                title={order.creditPersonId.phone}
                              >
                                {order.creditPersonId.phone}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            <span className="text-slate-400 text-xs sm:text-sm">
                              <span className="hidden sm:inline">
                                No customer assigned
                              </span>
                              <span className="sm:hidden">No customer</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-slate-600 text-xs sm:text-sm">
                        {order.ordersProducts?.length || 0} items
                      </td>
                      <td className="px-2 sm:px-4 py-3 font-medium text-slate-800 text-xs sm:text-sm">
                        {order.finalAmount.toLocaleString()}{" "}
                        <span className="hidden sm:inline">MMK</span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 font-medium text-slate-800 text-xs sm:text-sm">
                        {order.paidAmount.toLocaleString()}{" "}
                        <span className="hidden sm:inline">MMK</span>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <span className="font-medium text-orange-600 text-xs sm:text-sm">
                          {order.remainingBalance.toLocaleString()}{" "}
                          <span className="hidden sm:inline">MMK</span>
                        </span>
                      </td>

                      <td className="px-2 sm:px-4 py-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleViewOrder(order._id)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded hover:bg-blue-200 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />{" "}
                            <span className="hidden xl:block">View</span>
                            <span className="xl:hidden sm:hidden">V</span>
                          </button>
                          {!order.creditPersonId && (
                            <button
                              onClick={() => handleOpenCreditPersonModal(order)}
                              className="text-xs bg-orange-100 text-orange-700 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded hover:bg-orange-200 border border-orange-200 font-medium transition-colors flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span className="hidden xl:block">
                                <span className="hidden sm:inline">
                                  Add Credit Person
                                </span>
                                <span className="sm:hidden">Add</span>
                              </span>
                            </button>
                          )}
                          {order.creditPersonId && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1.5 rounded flex items-center gap-1">
                              <User className="w-3 h-3" />{" "}
                              <span className="hidden xl:block">Assigned</span>
                              <span className="xl:hidden sm:hidden">✓</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        loading={loadingDetail}
        onRefresh={handleRefreshOrderDetails}
      />

      {/* Credit Person Selection Modal */}
      <CreditPersonModal
        isOpen={showCreditPersonModal}
        order={selectedOrderForCredit}
        creditPersonas={creditPersonas}
        assigning={assigningCreditPerson}
        onClose={() => {
          setShowCreditPersonModal(false);
          setSelectedOrderForCredit(null);
        }}
        onAssign={handleAssignCreditPerson}
      />
    </div>
  );
};
