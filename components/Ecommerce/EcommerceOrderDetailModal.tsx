import React, { useState } from "react";
import {
  X,
  RefreshCw,
  Receipt,
  Calendar,
  User,
  Package,
  CreditCard,
  Plus,
  Minus,
} from "lucide-react";
import type { EcommerceOrder } from "../../services/Ecommerce/fetchEcommerceOrders";
import { useLanguage } from "../../context/LanguageContext";
import { AddItemsToEcommerceOrderModal } from "./AddItemsToEcommerceOrderModal";
import { RemoveItemsFromEcommerceOrderModal } from "./RemoveItemsFromEcommerceOrderModal";

interface EcommerceOrderDetailModalProps {
  isOpen: boolean;
  loading: boolean;
  order: EcommerceOrder | null;
  onClose: () => void;
  onOrderUpdate?: () => void;
}

export const EcommerceOrderDetailModal: React.FC<
  EcommerceOrderDetailModalProps
> = ({ isOpen, loading, order, onClose, onOrderUpdate }) => {
  const { t } = useLanguage();
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showRemoveItemsModal, setShowRemoveItemsModal] = useState(false);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusKey = order?.status ?? "pending";
  const statusLabelMm =
    t(`ecommerceOrders.statusLabelsMm.${statusKey}`) ||
    t(`ecommerceOrders.statusLabels.${statusKey}`);

  const paymentLabel =
    t(`ecommerceOrders.paymentMethods.${order?.paymentMethod}`) ||
    order?.paymentMethod;

  const primaryProductImage =
    order?.products[0]?.inventoryId?.images?.find((img) => img.isPrimary)
      ?.url ||
    order?.products[0]?.inventoryId?.images?.[0]?.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-row justify-between items-start gap-4 p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            {t("ecommerceOrders.title")}
          </h3>
          <div className="flex items-center gap-2">
            {order && (
              <>
                <button
                  onClick={() => setShowRemoveItemsModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <Minus className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("orders.removeItems") || "Remove Items"}
                  </span>
                </button>
                <button
                  onClick={() => setShowAddItemsModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("orders.addItems") || "Add Items"}
                  </span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading || !order ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-slate-500">{t("common.loading")}...</p>
            </div>
          ) : (
            <>
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    {t("ecommerceOrders.orderNumber")}
                  </p>
                  <p className="font-bold text-blue-800">{order.orderNumber}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    {t("ecommerceOrders.status")}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                      order.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : order.status === "confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "shipped"
                        ? "bg-purple-100 text-purple-800"
                        : order.status === "delivered"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {statusLabelMm}
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className="mb-6 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </div>

              {/* Customer & shipping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-teal-600" />
                    <p className="text-xs text-teal-600 font-medium">
                      {t("ecommerceOrders.detail.customerInfo")}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-teal-800">
                    {order.customerId?.name || "-"}
                  </p>
                  <p className="text-xs text-teal-700 mt-1">
                    {order.customerId?.phone || "-"}
                  </p>
                </div>
                <div className="bg-slate-50 border rounded-lg p-4">
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    {t("ecommerceOrders.detail.customerInfo")}
                  </p>
                  <p className="text-xs text-slate-700">
                    {order.shippingAddress?.label
                      ? `[${order.shippingAddress.label}] `
                      : ""}
                    {order.shippingAddress?.addressLine || "-"},{" "}
                    {order.shippingAddress?.city || "-"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {order.shippingAddress?.phone || "-"}
                  </p>
                </div>
              </div>

              {/* Products */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t("ecommerceOrders.detail.products")}
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-left font-medium text-slate-600">
                          Image
                        </th>
                        <th className="p-3 text-left font-medium text-slate-600">
                          {t("inventory.productName")}
                        </th>
                        <th className="p-3 text-left font-medium text-slate-600">
                          {t("inventory.productCode")}
                        </th>
                        <th className="p-3 text-center font-medium text-slate-600">
                          {t("common.quantity")}
                        </th>
                        <th className="p-3 text-right font-medium text-slate-600">
                          {t("common.price")}
                        </th>
                        <th className="p-3 text-right font-medium text-slate-600">
                          {t("common.subtotal")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order.products.map((p, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="p-3">
                            {p.inventoryId.images?.[0]?.url ? (
                              <img
                                src={
                                  p.inventoryId.images.find((img) => img.isPrimary)
                                    ?.url || p.inventoryId.images[0].url
                                }
                                alt={p.inventoryId.productName}
                                className="w-10 h-10 rounded object-cover border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded border bg-slate-100" />
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-800">
                            {p.inventoryId.productName}
                          </td>
                          <td className="p-3 text-slate-600">
                            {p.inventoryId.productCode}
                          </td>
                          <td className="p-3 text-center font-medium">
                            {p.quantity.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            {p.unitPrice.toLocaleString()} MMK
                          </td>
                          <td className="p-3 text-right font-medium text-slate-800">
                            {p.subtotal.toLocaleString()} MMK
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border mb-6">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {t("ecommerceOrders.payment")}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("ecommerceOrders.total")}</span>
                    <span className="font-semibold">
                      {order.totalAmount.toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("common.method")}</span>
                    <span>{paymentLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        order.paymentStatus === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {order.paymentStatus === "paid"
                        ? t("common.paid")
                        : t("common.remaining")}
                    </span>
                  </div>
                </div>
              </div>

              {primaryProductImage && (
                <div className="mb-6 border rounded-lg overflow-hidden bg-slate-50">
                  <img
                    src={primaryProductImage}
                    alt={order.products[0]?.inventoryId?.productName}
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}

              {/* Note */}
              {order.note && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    {t("ecommerceOrders.detail.note")}
                  </p>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">
                    {order.note}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AddItemsToEcommerceOrderModal
        isOpen={showAddItemsModal}
        order={order}
        onClose={() => setShowAddItemsModal(false)}
        onSuccess={() => {
          setShowAddItemsModal(false);
          if (onOrderUpdate) onOrderUpdate();
        }}
      />

      <RemoveItemsFromEcommerceOrderModal
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

