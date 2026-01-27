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
} from "lucide-react";
import { Order } from "../../services/Order/fetchOrders";
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
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  loading,
  orders,
  onViewOrder,
  onOpenCreditPersonModal,
}) => {
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
      {/* Mobile scroll indicator */}
      <div className="sm:hidden px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center">
        ← Swipe to see more →
      </div>

      {/* Table container with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                <span className="hidden sm:inline">Order Number</span>
                <span className="sm:hidden">Order #</span>
              </th>
              {/* <th className="p-4 font-semibold text-slate-600">Storefront</th> */}
              <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                <span className="hidden sm:inline">Items</span>
                <span className="sm:hidden">Items</span>
              </th>
              <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                <span className="hidden sm:inline">Final Amount</span>
                <span className="sm:hidden">Total</span>
              </th>
              <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                <span className="hidden sm:inline">Paid</span>
                <span className="sm:hidden">Paid</span>
              </th>
              <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                <span className="hidden sm:inline">Method</span>
                <span className="sm:hidden">Method</span>
              </th>
              {/* <th className="p-4 font-semibold text-slate-600">Sold By</th> */}
              {/* <th className="p-4 font-semibold text-slate-600">Credit Person</th> */}
              {/* <th className="p-4 font-semibold text-slate-600">Status</th> */}
              {/* <th className="p-4 font-semibold text-slate-600">Date</th> */}
              <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                <span className="hidden sm:inline">Actions</span>
                <span className="sm:hidden">A</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-slate-50">
                <td className="px-2 sm:px-4 py-3 font-medium text-blue-600 text-xs sm:text-sm">
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
                <td className="px-2 sm:px-4 py-3">
                  <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                    {order.ordersProducts?.length || 0} item(s)
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-3 font-bold text-slate-800 text-xs sm:text-sm">
                  {order.finalAmount?.toLocaleString()}{" "}
                  <span className="hidden sm:inline">MMK</span>
                </td>
                <td className="px-2 sm:px-4 py-3 font-bold text-green-600 text-xs sm:text-sm">
                  {order.paidAmount?.toLocaleString()}{" "}
                  <span className="hidden sm:inline">MMK</span>
                </td>

                <td className="px-2 sm:px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </span>
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
                <td className="px-2 sm:px-4 py-3">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => onViewOrder(order._id)}
                      className="text-xs bg-primary/20 text-yellow-800 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded hover:bg-primary/30 border border-primary/30 font-medium transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />{" "}
                      <span className="hidden xl:inline">View</span>
                      <span className="xl:hidden sm:hidden">V</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
