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

export const Orders: React.FC = () => {
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

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [selectedStorefrontId]);

  const loadInitialData = async () => {
    // Load storefronts
    try {
      const sfResponse = await fetchStorefrontProfiles();
      if (sfResponse.success && sfResponse.data) {
        setStorefronts(sfResponse.data);
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

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (selectedStorefrontId === "all") {
        // Fetch all orders
        const response = await fetchOrders();
        if (response.success && response.data) {
          setOrders(response.data.reverse());
        } else {
          toast.error(response.message || "Failed to load orders");
        }
      } else {
        // Fetch orders by storefront
        const response = await fetchOrdersByStorefront(selectedStorefrontId);
        if (response.success && response.data) {
          setOrders(response.data.orders.reverse());
        } else {
          toast.error(response.message || "Failed to load orders");
        }
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
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
        toast.error(response.message || "Failed to load order details");
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoadingDetail(false);
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
        creditPersonId
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary" />
            Order Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View and manage all sales orders
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
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
