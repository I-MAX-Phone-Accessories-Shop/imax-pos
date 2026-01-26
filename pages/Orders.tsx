import React, { useState, useEffect } from "react";
import { RefreshCw, Receipt } from "lucide-react";
import { toast } from "sonner";
import { fetchOrders, Order } from "../services/Order/fetchOrders";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { fetchOrdersByStorefront } from "../services/Order/fetchOrdersByStorefront";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { assignCreditPerson } from "../services/Order/assignCreditPerson";
import { OrdersFilters } from "../components/Orders/OrdersFilters";
import { OrdersTable } from "../components/Orders/OrdersTable";
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

export const Orders: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] =
    useState<string>("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
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
  }, [selectedStorefrontId, startDate, endDate]);

  const loadInitialData = async () => {
    // Load storefronts
    try {
      const sfResponse = await fetchStorefrontProfiles();
      if (sfResponse.success && sfResponse.data) {
        setStorefronts(sfResponse.data.reverse());
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    }

    // Load credit personas
    try {
      const cpResponse = await fetchCreditPersonas();
      if (cpResponse.success && cpResponse.data) {
        setCreditPersonas(cpResponse.data.filter((p) => !p.blacklist));
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
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

      // console.log("Loading orders with dates:", {
      //   startDateStr,
      //   endDateStr,
      //   selectedStorefrontId,
      // });

      // Always fetch only paid orders with date filtering
      const response = await fetchOrders(startDateStr, endDateStr, "paid");
      // console.log("All orders response:", response);

      if (response.success && response.data) {
        let filteredOrders = response.data;

        // If a specific storefront is selected, filter the results
        if (selectedStorefrontId !== "all") {
          filteredOrders = response.data.filter(
            (order) =>
              order.storefrontId?._id === selectedStorefrontId ||
              order.storefrontId?.id === selectedStorefrontId,
          );
        }

        // console.log("Filtered orders count:", filteredOrders.length);
        setOrders(filteredOrders);
      } else {
        toast.error(response.message || t("orders.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading orders:", error);
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
        .includes(search.toLowerCase());
    const matchesPaymentType =
      paymentTypeFilter === "all" ||
      order.paymentType?.toLowerCase() === paymentTypeFilter.toLowerCase();
    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      order.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase();
    return matchesSearch && matchesPaymentType && matchesPaymentMethod;
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
        toast.success(t("orders.creditPersonAssigned"));
        setShowCreditPersonModal(false);
        setSelectedOrderForCredit(null);
        // Refresh orders
        await loadOrders();
      } else {
        toast.error(response.message || t("orders.failedToAssign"));
      }
    } catch (error) {
      console.error("Error assigning credit person:", error);
      toast.error(t("orders.failedToAssign"));
    } finally {
      setAssigningCreditPerson(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    // Remove the deleted order from the state
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order._id !== orderId),
    );
    // Close the detail modal if the deleted order is currently being viewed
    if (selectedOrder?._id === orderId) {
      setSelectedOrder(null);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary" />
            {t("orders.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t("orders.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <OrdersFilters
        search={search}
        onSearchChange={setSearch}
        storefronts={storefronts}
        selectedStorefrontId={selectedStorefrontId}
        onStorefrontChange={setSelectedStorefrontId}
        paymentTypeFilter={paymentTypeFilter}
        onPaymentTypeChange={setPaymentTypeFilter}
        paymentMethodFilter={paymentMethodFilter}
        onPaymentMethodChange={setPaymentMethodFilter}
        orders={orders}
        filteredOrders={filteredOrders}
      />

      {/* Orders Table */}
      <OrdersTable
        loading={loading}
        orders={filteredOrders}
        onViewOrder={handleViewOrder}
        onOpenCreditPersonModal={handleOpenCreditPersonModal}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!(selectedOrder || loadingDetail)}
        loading={loadingDetail}
        order={selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setLoadingDetail(false);
        }}
        onOrderUpdate={async () => {
          await loadOrders();
          await handleRefreshOrderDetails();
        }}
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
