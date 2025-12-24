import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  ShoppingBag,
  Store,
  Calendar,
  CreditCard,
  Package,
  Receipt,
  Filter,
  UserPlus,
  User,
} from "lucide-react";
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

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
          setOrders(response.data);
        } else {
          toast.error(response.message || "Failed to load orders");
        }
      } else {
        // Fetch orders by storefront
        const response = await fetchOrdersByStorefront(selectedStorefrontId);
        if (response.success && response.data) {
          setOrders(response.data.orders);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "refunded":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    const labels: Record<string, string> = {
      paid: "Paid",
      credit: "Credit",
    };
    return labels[paymentType?.toLowerCase()] || paymentType;
  };

  const getPaymentMethodLabel = (paymentMethod: string) => {
    const labels: Record<string, string> = {
      cash: "Cash",
      kpay: "KBZ Pay",
      kbzpay: "KBZ Pay",
      wavepay: "Wave Pay",
      ayapay: "AYA Pay",
      uabpay: "UAB Pay",
      bank_transfer: "Bank Transfer",
    };
    return labels[paymentMethod?.toLowerCase()] || paymentMethod;
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "credit":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      order.storefrontId?.storefrontName
        ?.toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      order.orderStatus?.toLowerCase() === statusFilter.toLowerCase();
    const matchesPaymentType =
      paymentTypeFilter === "all" ||
      order.paymentType?.toLowerCase() === paymentTypeFilter.toLowerCase();
    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      order.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase();
    return (
      matchesSearch &&
      matchesStatus &&
      matchesPaymentType &&
      matchesPaymentMethod
    );
  });

  const uniqueStatuses = Array.from(new Set(orders.map((o) => o.orderStatus)));
  const uniquePaymentMethods = Array.from(
    new Set(orders.map((o) => o.paymentMethod).filter(Boolean))
  );

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
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or store..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Storefront Filter */}
          <div className="flex items-center gap-2">
            {/* <Store className="w-4 h-4 text-slate-400" /> */}
            <select
              className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={selectedStorefrontId}
              onChange={(e) => setSelectedStorefrontId(e.target.value)}
            >
              <option value="all">All Storefronts</option>
              {storefronts.map((sf) => (
                <option key={sf.id} value={sf.id}>
                  {sf.storefrontName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          {/* <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {uniqueStatuses.map((status) => (
                <option key={String(status)} value={String(status)}>
                  {String(status).charAt(0).toUpperCase() +
                    String(status).slice(1)}
                </option>
              ))}
            </select>
          </div> */}

          {/* Payment Type Filter */}
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="paid">Paid</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-2">
            {/* <CreditCard className="w-4 h-4 text-slate-400" /> */}
            <select
              className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              {uniquePaymentMethods.map((method) => (
                <option key={String(method)} value={String(method)}>
                  {getPaymentMethodLabel(String(method))}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-slate-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-slate-500">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-slate-600">
                  Order Number
                </th>
                <th className="p-4 font-semibold text-slate-600">Storefront</th>
                <th className="p-4 font-semibold text-slate-600">Items</th>
                <th className="p-4 font-semibold text-slate-600 text-right">
                  Final Amount
                </th>
                <th className="p-4 font-semibold text-slate-600 text-right">
                  Paid
                </th>
                <th className="p-4 font-semibold text-slate-600">Type</th>
                <th className="p-4 font-semibold text-slate-600">Method</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600">Date</th>
                <th className="p-4 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-blue-600">
                    {order.orderNumber}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-slate-400" />
                      <span>{order.storefrontId?.storefrontName || "-"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                      {order.ordersProducts?.length || 0} item(s)
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-800">
                    {order.finalAmount?.toLocaleString()} MMK
                  </td>
                  <td className="p-4 text-right text-green-600 font-medium">
                    {order.paidAmount?.toLocaleString()} MMK
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${getPaymentTypeColor(
                        order.paymentType
                      )}`}
                    >
                      {getPaymentTypeLabel(order.paymentType)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-xs">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewOrder(order._id)}
                        className="text-xs bg-primary/20 text-yellow-800 px-3 py-1.5 rounded hover:bg-primary/30 border border-primary/30 font-medium transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                      {order.paymentType?.toLowerCase() === "credit" &&
                        !order.creditPersonId && (
                          <button
                            onClick={() => handleOpenCreditPersonModal(order)}
                            className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-200 border border-orange-200 font-medium transition-colors flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" /> Add Person
                          </button>
                        )}
                      {order.paymentType?.toLowerCase() === "credit" &&
                        order.creditPersonId && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                            <User className="w-3 h-3" /> Assigned
                          </span>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {(selectedOrder || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Order Details
              </h3>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setLoadingDetail(false);
                }}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-slate-500">Loading order details...</p>
                </div>
              ) : selectedOrder ? (
                <>
                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        Order Number
                      </p>
                      <p className="font-bold text-blue-800">
                        {selectedOrder.orderNumber}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-xs text-green-600 font-medium mb-1">
                        Status
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                          selectedOrder.orderStatus
                        )}`}
                      >
                        {selectedOrder.orderStatus?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Store & Date Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Store className="w-4 h-4" />
                      <span>
                        {selectedOrder.storefrontId?.storefrontName || "-"}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({selectedOrder.storefrontId?.storefrontCode})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Order Items
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-3 text-left font-medium text-slate-600">
                              Product
                            </th>
                            <th className="p-3 text-center font-medium text-slate-600">
                              Qty
                            </th>
                            <th className="p-3 text-right font-medium text-slate-600">
                              Unit Price
                            </th>
                            <th className="p-3 text-right font-medium text-slate-600">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedOrder.ordersProducts?.map((item, index) => (
                            <tr key={item._id || index}>
                              <td className="p-3">
                                <div>
                                  <p className="font-medium text-slate-800">
                                    {item.inventoryId?.productName || "Unknown"}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {item.inventoryId?.productCode}
                                  </p>
                                </div>
                              </td>
                              <td className="p-3 text-center font-medium">
                                {item.quantity}
                              </td>
                              <td className="p-3 text-right text-slate-600">
                                {item.unitPrice?.toLocaleString()} MMK
                              </td>
                              <td className="p-3 text-right font-medium text-slate-800">
                                {(
                                  item.quantity * (item.unitPrice || 0)
                                ).toLocaleString()}{" "}
                                MMK
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payment Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subtotal</span>
                        <span>
                          {selectedOrder.subTotal?.toLocaleString()} MMK
                        </span>
                      </div>
                      {selectedOrder.tax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tax</span>
                          <span>{selectedOrder.tax?.toLocaleString()} MMK</span>
                        </div>
                      )}
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>
                            -{selectedOrder.discount?.toLocaleString()} MMK
                          </span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Final Amount</span>
                        <span>
                          {selectedOrder.finalAmount?.toLocaleString()} MMK
                        </span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Paid Amount</span>
                        <span>
                          {selectedOrder.paidAmount?.toLocaleString()} MMK
                        </span>
                      </div>
                      {selectedOrder.extraChange > 0 && (
                        <div className="flex justify-between text-blue-600 font-medium">
                          <span>Change</span>
                          <span>
                            {selectedOrder.extraChange?.toLocaleString()} MMK
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-slate-500">Payment Type</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPaymentTypeColor(
                            selectedOrder.paymentType
                          )}`}
                        >
                          {getPaymentTypeLabel(selectedOrder.paymentType)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payment Method</span>
                        <span className="font-medium">
                          {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                        </span>
                      </div>
                      {selectedOrder.remainingBalance !== undefined &&
                        selectedOrder.remainingBalance > 0 && (
                          <div className="flex justify-between text-orange-600 font-medium">
                            <span>Remaining Balance</span>
                            <span>
                              {selectedOrder.remainingBalance?.toLocaleString()}{" "}
                              MMK
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Credit Person Selection Modal */}
      {showCreditPersonModal && selectedOrderForCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-orange-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                Assign Credit Person
              </h3>
              <button
                onClick={() => {
                  setShowCreditPersonModal(false);
                  setSelectedOrderForCredit(null);
                }}
                className="p-1 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  Order:{" "}
                  <span className="font-bold text-blue-600">
                    {selectedOrderForCredit.orderNumber}
                  </span>
                </p>
                <p className="text-sm text-slate-600">
                  Amount:{" "}
                  <span className="font-bold">
                    {selectedOrderForCredit.finalAmount?.toLocaleString()} MMK
                  </span>
                </p>
              </div>

              <p className="text-sm text-slate-500 mb-3">
                Select a credit person to assign to this order:
              </p>

              {creditPersonas.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No credit persons available</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {creditPersonas.map((persona) => (
                    <button
                      key={persona._id}
                      onClick={() => handleAssignCreditPerson(persona._id)}
                      disabled={assigningCreditPerson}
                      className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">
                          {persona.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {persona.phone}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-slate-50">
              <button
                onClick={() => {
                  setShowCreditPersonModal(false);
                  setSelectedOrderForCredit(null);
                }}
                disabled={assigningCreditPerson}
                className="w-full py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
