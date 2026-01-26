import React from "react";
import {
  RefreshCw,
  Eye,
  ShoppingBag,
  Store,
  CreditCard,
  UserPlus,
  User,
  UserCircle,
  Trash2,
} from "lucide-react";
import { Order } from "../../services/Order/fetchOrders";
import { deleteOrder } from "../../services/Order/deleteOrder";
import {
  getStatusColor,
  getPaymentTypeLabel,
  getPaymentMethodLabel,
  getPaymentTypeColor,
  formatDate,
} from "./orderUtils";

interface OrdersTableProps {
  loading: boolean;
  orders: Order[];
  onViewOrder: (orderId: string) => void;
  onOpenCreditPersonModal: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  loading,
  orders,
  onViewOrder,
  onOpenCreditPersonModal,
  onDeleteOrder,
}) => {
  const handleDelete = async (orderId: string, orderNumber: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      const result = await deleteOrder(orderId);
      if (result.success) {
        onDeleteOrder(orderId);
        alert(`Order ${orderNumber} deleted successfully`);
      } else {
        alert(`Failed to delete order: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("An error occurred while deleting the order");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-slate-500">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No orders found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="p-4 font-semibold text-slate-600">Order Number</th>
            {/* <th className="p-4 font-semibold text-slate-600">Storefront</th> */}
            <th className="p-4 font-semibold text-slate-600">Items</th>
            <th className="p-4 font-semibold text-slate-600">Final Amount</th>
            <th className="p-4 font-semibold text-slate-600">Paid</th>
            <th className="p-4 font-semibold text-slate-600">Method</th>
            {/* <th className="p-4 font-semibold text-slate-600">Sold By</th> */}
            {/* <th className="p-4 font-semibold text-slate-600">Credit Person</th> */}
            {/* <th className="p-4 font-semibold text-slate-600">Status</th> */}
            {/* <th className="p-4 font-semibold text-slate-600">Date</th> */}
            <th className="p-4 font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((order) => (
            <tr key={order._id} className="hover:bg-slate-50">
              <td className="p-4 font-medium text-blue-600">
                {order.orderNumber}
              </td>
              {/* <td className="p-4">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-slate-400" />
                  <span>
                    {order.storefrontId?.locationName ||
                      order.storefrontId?.storefrontName ||
                      "-"}
                  </span>
                </div>
              </td> */}
              <td className="p-4">
                <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                  {order.ordersProducts?.length || 0} item(s)
                </span>
              </td>
              <td className="p-4 font-bold text-slate-800">
                {order.finalAmount?.toLocaleString()} MMK
              </td>
              <td className="p-4 font-bold text-green-600">
                {order.paidAmount?.toLocaleString()} MMK
              </td>

              <td className="p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                </div>
              </td>
              {/* <td className="p-4">
                {order.soldBy ? (
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-800">
                        {order.soldBy.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.soldBy.role}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">-</span>
                )}
              </td> */}
              {/* <td className="p-4">
                {order.creditPersonId &&
                typeof order.creditPersonId === "object" ? (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-medium text-slate-800">
                        {order.creditPersonId.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.creditPersonId.phone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">-</span>
                )}
              </td> */}
              {/* <td className="p-4">
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
              </td> */}
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewOrder(order._id)}
                    className="text-xs bg-primary/20 text-yellow-800 px-3 py-1.5 rounded hover:bg-primary/30 border border-primary/30 font-medium transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />{" "}
                    <span className="hidden xl:block">View</span>
                  </button>
                  <button
                    onClick={() => handleDelete(order._id, order.orderNumber)}
                    className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded hover:bg-red-200 border border-red-200 font-medium transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />{" "}
                    <span className="hidden xl:block">Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
