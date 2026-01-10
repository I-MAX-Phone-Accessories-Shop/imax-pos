import React, { useState, useEffect } from "react";
import { X, Minus, Trash2, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { Order } from "../../services/Order/fetchOrders";
import { removeItemsFromOrder } from "../../services/Order/removeItemsFromOrder";
import { AddItemToOrderRequest } from "../../services/Order/addItemsToOrder";
import { useLanguage } from "../../context/LanguageContext";

interface SelectedItemToRemove {
  inventoryId: string;
  productName: string;
  productCode: string;
  currentQuantity: number;
  removeQuantity: number;
  unitPrice: number;
  subtotalToRemove: number;
}

interface RemoveItemsFromOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RemoveItemsFromOrderModal: React.FC<
  RemoveItemsFromOrderModalProps
> = ({ isOpen, order, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [selectedItems, setSelectedItems] = useState<SelectedItemToRemove[]>(
    []
  );
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      // Initialize form with existing order values
      setTax(order.tax || 0);
      setDiscount(order.discount || 0);
      setPaidAmount(order.paidAmount || 0);
      // Initialize selected items from order products
      const initialItems: SelectedItemToRemove[] =
        order.ordersProducts?.map((item) => ({
          inventoryId: item.inventoryId._id,
          productName: item.inventoryId.productName || "Unknown",
          productCode: item.inventoryId.productCode || "",
          currentQuantity: item.quantity,
          removeQuantity: 0,
          unitPrice: item.unitPrice || 0,
          subtotalToRemove: 0,
        })) || [];
      setSelectedItems(initialItems);
    } else {
      // Reset form when modal closes
      setSelectedItems([]);
      setTax(0);
      setDiscount(0);
      setPaidAmount(0);
    }
  }, [isOpen, order]);

  const handleQuantityChange = (
    inventoryId: string,
    removeQuantity: number
  ) => {
    const updatedItems = selectedItems.map((item) => {
      if (item.inventoryId === inventoryId) {
        // Ensure removeQuantity doesn't exceed currentQuantity and is not negative
        const validQuantity = Math.max(
          0,
          Math.min(removeQuantity, item.currentQuantity)
        );
        return {
          ...item,
          removeQuantity: validQuantity,
          subtotalToRemove: validQuantity * item.unitPrice,
        };
      }
      return item;
    });
    setSelectedItems(updatedItems);
  };

  const handleRemoveItem = (inventoryId: string) => {
    // Remove item from selection (set removeQuantity to 0, but keep in list)
    handleQuantityChange(inventoryId, 0);
  };

  const calculateTotals = () => {
    const itemsToRemoveSubtotal = selectedItems.reduce(
      (sum, item) => sum + item.subtotalToRemove,
      0
    );
    const existingSubtotal = order?.subTotal || 0;
    const existingTax = order?.tax || 0;
    const existingDiscount = order?.discount || 0;

    // Total subtotal after removing items
    const totalSubtotal = Math.max(0, existingSubtotal - itemsToRemoveSubtotal);

    // Tax: If tax form value is different from existing, use the form value as absolute amount
    // Otherwise, calculate proportionally based on new subtotal
    const calculatedTax =
      tax !== existingTax
        ? tax
        : existingSubtotal > 0
        ? Math.max(
            0,
            Math.round(
              ((totalSubtotal * existingTax) / existingSubtotal) * 100
            ) / 100
          )
        : 0;

    // Discount: If discount form value is different from existing, use the form value as absolute amount
    // Otherwise, keep existing discount
    const calculatedDiscount =
      discount !== existingDiscount ? discount : existingDiscount;

    // Final amount after tax and discount
    const finalAmount = Math.max(
      0,
      totalSubtotal + calculatedTax - calculatedDiscount
    );

    // Extra change = paidAmount - finalAmount (if paidAmount > finalAmount)
    const extraChange = Math.max(0, paidAmount - finalAmount);

    return {
      subTotal: totalSubtotal,
      tax: calculatedTax,
      discount: calculatedDiscount,
      finalAmount,
      extraChange,
      paidAmount,
    };
  };

  const handleSubmitRemoveItems = async () => {
    // Filter items where removeQuantity > 0
    const itemsToRemove = selectedItems.filter(
      (item) => item.removeQuantity > 0
    );

    if (itemsToRemove.length === 0) {
      toast.error(
        t("orders.noItemsSelectedToRemove") || "Please select items to remove"
      );
      return;
    }

    if (!order) return;

    setSubmitting(true);
    try {
      const totals = calculateTotals();

      const payload = {
        items: itemsToRemove.map((item) => ({
          inventoryId: item.inventoryId,
          quantity: item.removeQuantity, // Negative quantity for removal
        })) as AddItemToOrderRequest[],
        subTotal: totals.subTotal,
        tax: totals.tax,
        discount: totals.discount,
        finalAmount: totals.finalAmount,
        extraChange: totals.extraChange,
        paidAmount: totals.paidAmount,
      };

      const response = await removeItemsFromOrder(order._id, payload);

      if (response.success) {
        toast.success(
          t("orders.itemsRemovedSuccess") || "Items removed successfully"
        );
        onClose();
        setSelectedItems([]);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(
          response.message ||
            t("orders.failedToRemoveItems") ||
            "Failed to remove items"
        );
      }
    } catch (error: any) {
      console.error("Error removing items from order:", error);
      toast.error(
        error.message ||
          t("orders.failedToRemoveItems") ||
          "Failed to remove items"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  const itemsToRemove = selectedItems.filter((item) => item.removeQuantity > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/10 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Minus className="w-5 h-5 text-red-600" />
            {t("orders.removeItemsFromOrder") || "Remove Items from Order"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Modal Body - Two Column Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Column: Current Order Items */}
          <div className="flex-1 border-r overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-slate-50">
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t("orders.currentOrderItems") || "Current Order Items"} (
                {selectedItems.length})
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    {t("orders.noItemsInOrder") || "No items in this order"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div
                      key={item.inventoryId}
                      className="bg-slate-50 p-3 rounded-lg border"
                    >
                      <div className="mb-2">
                        <p className="font-medium text-slate-800 text-sm">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.productCode}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            {t("orders.currentQuantity") || "Current Qty"}:{" "}
                            <span className="font-medium text-slate-700">
                              {item.currentQuantity}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {t("orders.unitPrice") || "Unit Price"}:{" "}
                            <span className="font-medium text-slate-700">
                              {item.unitPrice.toLocaleString()} MMK
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.inventoryId,
                                  item.removeQuantity - 1
                                )
                              }
                              disabled={item.removeQuantity <= 0}
                              className="w-6 h-6 rounded border flex items-center justify-center hover:bg-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={item.currentQuantity}
                              value={item.removeQuantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.inventoryId,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 text-center border rounded py-1 text-sm"
                            />
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.inventoryId,
                                  item.removeQuantity + 1
                                )
                              }
                              disabled={
                                item.removeQuantity >= item.currentQuantity
                              }
                              className="w-6 h-6 rounded border flex items-center justify-center hover:bg-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                          {/* {item.removeQuantity > 0 && (
                            <div className="text-right min-w-[90px]">
                              <p className="font-medium text-red-600 text-sm">
                                -{item.subtotalToRemove.toLocaleString()} MMK
                              </p>
                            </div>
                          )} */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Items to Remove & Totals */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Items to Remove */}
            <div className="flex-1 overflow-y-auto p-4 border-b bg-white">
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Minus className="w-4 h-4 text-red-600" />
                {t("orders.itemsToRemove") || "Items to Remove"} (
                {itemsToRemove.length})
              </h4>
              {itemsToRemove.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  {t("orders.noItemsSelectedToRemove") ||
                    "Select quantities to remove above"}
                </p>
              ) : (
                <div className="space-y-2">
                  {itemsToRemove.map((item) => (
                    <div
                      key={item.inventoryId}
                      className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.productCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right min-w-[100px]">
                          <p className="font-medium text-red-600 text-sm">
                            -{item.removeQuantity} x{" "}
                            {item.unitPrice.toLocaleString()}
                          </p>
                          <p className="font-medium text-red-600 text-sm">
                            -{item.subtotalToRemove.toLocaleString()} MMK
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.inventoryId)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals & Financial Inputs */}
            <div className="p-4 border-t bg-white">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t("orders.tax") || "Tax"} (MMK)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t("orders.discount") || "Discount"} (MMK)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(parseFloat(e.target.value) || 0)
                    }
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t("orders.paidAmount") || "Paid Amount"} (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) =>
                    setPaidAmount(parseFloat(e.target.value) || 0)
                  }
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 text-xs mb-3">
                {(() => {
                  const totals = calculateTotals();
                  const itemsToRemoveSubtotal = selectedItems.reduce(
                    (sum, item) => sum + item.subtotalToRemove,
                    0
                  );
                  const existingSubtotal = order?.subTotal || 0;
                  return (
                    <>
                      {itemsToRemove.length > 0 && (
                        <>
                          <div className="flex justify-between text-slate-500 pb-1 border-b">
                            <span>
                              {t("orders.currentSubtotal") ||
                                "Current Subtotal"}
                              :
                            </span>
                            <span>{existingSubtotal.toLocaleString()} MMK</span>
                          </div>
                          <div className="flex justify-between text-red-600 pb-1">
                            <span>
                              {t("orders.itemsToRemoveSubtotal") ||
                                "Items to Remove Subtotal"}
                              :
                            </span>
                            <span>
                              -{itemsToRemoveSubtotal.toLocaleString()} MMK
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between pt-1 border-t font-medium">
                        <span className="text-slate-700">
                          {t("orders.totalSubtotal") || "Total Subtotal"}
                        </span>
                        <span className="font-bold">
                          {totals.subTotal.toLocaleString()} MMK
                        </span>
                      </div>
                      {totals.tax > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>{t("orders.tax") || "Tax"}</span>
                          <span>+{totals.tax.toLocaleString()} MMK</span>
                        </div>
                      )}
                      {totals.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>{t("orders.discount") || "Discount"}</span>
                          <span>-{totals.discount.toLocaleString()} MMK</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-bold text-base text-primary">
                        <span>{t("orders.finalAmount") || "Final Amount"}</span>
                        <span>{totals.finalAmount.toLocaleString()} MMK</span>
                      </div>
                      {totals.extraChange > 0 && (
                        <div className="flex justify-between text-blue-600 font-medium">
                          <span>{t("orders.change") || "Change"}</span>
                          <span>{totals.extraChange.toLocaleString()} MMK</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button
                  onClick={handleSubmitRemoveItems}
                  disabled={submitting || itemsToRemove.length === 0}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("orders.removingItems") || "Removing Items..."}
                    </>
                  ) : (
                    <>
                      <Minus className="w-4 h-4" />
                      {t("orders.removeItems") || "Remove Items"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
