import React, { useState } from "react";
import {
  X,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  Info,
  Plus,
  Minus,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { OnlineOrder } from "../../services/OnlineStorefront/fetchOnlineOrders";
import { AddItemsToOnlineOrderModal } from "./AddItemsToOnlineOrderModal";
import { RemoveItemsFromOnlineOrderModal } from "./RemoveItemsFromOnlineOrderModal";

interface OnlineOrderDetailModalProps {
  isOpen: boolean;
  order: OnlineOrder | null;
  onClose: () => void;
  onOrderUpdate?: () => void;
}

export const OnlineOrderDetailModal: React.FC<OnlineOrderDetailModalProps> = ({
  isOpen,
  order,
  onClose,
  onOrderUpdate,
}) => {
  const { t } = useLanguage();
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showRemoveItemsModal, setShowRemoveItemsModal] = useState(false);

  if (!isOpen || !order) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {t("onlineOrders.orderDetails")}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {order.orderNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRemoveItemsModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <Minus className="w-4 h-4" />
              <span className="hidden sm:inline">
                {t("orders.removeItems")}
              </span>
            </button>
            <button
              onClick={() => setShowAddItemsModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("orders.addItems")}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <Info className="w-3.5 h-3.5" />
                {t("onlineOrders.status")}
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getStatusBadgeClass(order.orderStatus)}`}
              >
                {t(`onlineOrders.${order.orderStatus}`)}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <Calendar className="w-3.5 h-3.5" />
                {t("onlineOrders.date")}
              </div>
              <p className="text-slate-800 font-medium">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {t("onlineOrders.customer")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  {t("onlineOrders.customer")}
                </p>
                <p className="text-slate-800 font-semibold">
                  {order.customerName}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  {t("onlineOrders.phone")}
                </p>
                <p className="text-slate-800 font-semibold">
                  {order.customerPhone}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  {t("onlineOrders.address")}
                </p>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {order.customerAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              {t("orders.orderItems")}
            </h3>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left">
                    <th className="px-4 py-3 font-bold text-slate-500">
                      {t("orders.product")}
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-500 text-center">
                      {t("orders.qty")}
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-500 text-right">
                      {t("orders.unitPrice")}
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-500 text-right">
                      {t("common.total")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.ordersProducts.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {item.inventoryId.productName}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {item.inventoryId.productCode}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              {t("orders.paymentSummary")}
            </h3>
            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg space-y-3">
              <div className="flex justify-between items-center text-white/60 text-sm">
                <span>{t("orders.subTotal")}</span>
                <span>{order.subTotal.toLocaleString()} MMK</span>
              </div>
              <div className="flex justify-between items-center text-white/60 text-sm">
                <span>{t("orders.tax")}</span>
                <span>{order.tax.toLocaleString()} MMK</span>
              </div>
              <div className="flex justify-between items-center text-white/60 text-sm">
                <span>{t("orders.discount")}</span>
                <span className="text-red-400">
                  -{order.discount.toLocaleString()} MMK
                </span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="font-bold text-lg">
                  {t("orders.finalAmount")}
                </span>
                <span className="font-bold text-2xl text-primary">
                  {order.finalAmount.toLocaleString()} MMK
                </span>
              </div>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-white/40">{t("common.method")}</span>
                <span className="px-2 py-0.5 bg-white/10 rounded uppercase tracking-widest">
                  {order.paymentMethod.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-[10px] text-amber-600 font-bold uppercase mb-1">
                {t("common.notes")}
              </p>
              <p className="text-sm text-amber-800 italic">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200"
          >
            {t("common.close")}
          </button>
        </div>
      </div>

      {/* Add Items Modal */}
      <AddItemsToOnlineOrderModal
        isOpen={showAddItemsModal}
        order={order}
        onClose={() => setShowAddItemsModal(false)}
        onSuccess={() => {
          setShowAddItemsModal(false);
          if (onOrderUpdate) onOrderUpdate();
        }}
      />

      {/* Remove Items Modal */}
      <RemoveItemsFromOnlineOrderModal
        isOpen={showRemoveItemsModal}
        order={order}
        onClose={() => setShowRemoveItemsModal(false)}
        onSuccess={() => {
          setShowRemoveItemsModal(false);
          if (onOrderUpdate) onOrderUpdate();
        }}
      />
    </div>
  );
};
