import React, { useState, useEffect } from "react";
import { X, Minus, Trash2, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { OnlineOrder } from "../../services/OnlineStorefront/fetchOnlineOrders";
import { removeOnlineOrderItems } from "../../services/OnlineStorefront/onlineOrderManagement";
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

interface RemoveItemsFromOnlineOrderModalProps {
  isOpen: boolean;
  order: OnlineOrder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RemoveItemsFromOnlineOrderModal: React.FC<
  RemoveItemsFromOnlineOrderModalProps
> = ({ isOpen, order, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [selectedItems, setSelectedItems] = useState<SelectedItemToRemove[]>([]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      setTax(order.tax || 0);
      setDiscount(order.discount || 0);
      const subtotal = order.subTotal || 0;
      const calculatedPercent = subtotal > 0 ? Math.round((order.discount / subtotal) * 100 * 100) / 100 : 0;
      setDiscountPercent(calculatedPercent);

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
      setSelectedItems([]);
      setTax(0);
      setDiscount(0);
      setDiscountPercent(0);
    }
  }, [isOpen, order]);

  const handleQuantityChange = (inventoryId: string, removeQuantity: number) => {
    const updatedItems = selectedItems.map((item) => {
      if (item.inventoryId === inventoryId) {
        const validQuantity = Math.max(0, Math.min(removeQuantity, item.currentQuantity));
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

  useEffect(() => {
    if (order) {
      const itemsToRemoveSubtotal = selectedItems.reduce((sum, item) => sum + item.subtotalToRemove, 0);
      const totalSubtotal = Math.max(0, (order.subTotal || 0) - itemsToRemoveSubtotal);
      const calculatedDiscount = Math.max(0, Math.round(((totalSubtotal * discountPercent) / 100) * 100) / 100);
      setDiscount(calculatedDiscount);
    }
  }, [discountPercent, selectedItems, order]);

  const calculateTotals = () => {
    const itemsToRemoveSubtotal = selectedItems.reduce((sum, item) => sum + item.subtotalToRemove, 0);
    const totalSubtotal = Math.max(0, (order?.subTotal || 0) - itemsToRemoveSubtotal);
    const finalAmount = Math.max(0, totalSubtotal + tax - discount);
    return { subTotal: totalSubtotal, tax, discount, finalAmount };
  };

  const handleSubmit = async () => {
    const itemsToRemove = selectedItems.filter((item) => item.removeQuantity > 0);
    if (itemsToRemove.length === 0) {
      toast.error(t("orders.noItemsSelectedToRemove") || "Please select items to remove");
      return;
    }
    if (!order) return;

    setSubmitting(true);
    try {
      const totals = calculateTotals();
      const payload = {
        items: itemsToRemove.map((item) => ({
          inventoryId: item.inventoryId,
          quantity: item.removeQuantity,
        })),
        ...totals,
      };

      const response = await removeOnlineOrderItems(order._id, payload);
      if (response.success) {
        toast.success(t("orders.itemsRemovedSuccess") || "Items removed successfully");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || "Failed to remove items");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove items");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  const itemsToRemove = selectedItems.filter((item) => item.removeQuantity > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col font-sans">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Minus className="w-5 h-5 text-red-600" />
            {t("orders.removeItemsFromOrder")}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Current Items */}
          <div className="flex-1 border-r flex flex-col min-h-0">
            <div className="p-4 bg-slate-50 border-b">
              <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                {t("orders.currentOrderItems")} ({selectedItems.length})
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedItems.map((item) => (
                <div key={item.inventoryId} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="mb-2">
                    <p className="font-semibold text-slate-800 text-sm">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.productCode}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-slate-500">
                      <div>{t("orders.currentQuantity")}: <span className="font-bold text-slate-700">{item.currentQuantity}</span></div>
                      <div>{t("orders.unitPrice")}: <span className="font-bold text-slate-700">{item.unitPrice.toLocaleString()}</span></div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => handleQuantityChange(item.inventoryId, item.removeQuantity - 1)}
                        disabled={item.removeQuantity <= 0}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-red-500 transition-colors disabled:opacity-50"
                      >-</button>
                      <input 
                        type="number" 
                        value={item.removeQuantity} 
                        onChange={(e) => handleQuantityChange(item.inventoryId, parseInt(e.target.value) || 0)}
                        className="w-10 text-center text-xs font-bold bg-transparent border-none focus:ring-0"
                      />
                      <button 
                        onClick={() => handleQuantityChange(item.inventoryId, item.removeQuantity + 1)}
                        disabled={item.removeQuantity >= item.currentQuantity}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-red-500 transition-colors disabled:opacity-50"
                      >+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Removal Summary */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <h4 className="font-bold text-slate-700 text-sm">{t("orders.itemsToRemove")} ({itemsToRemove.length})</h4>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {itemsToRemove.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                  <Trash2 className="w-8 h-8 opacity-20" />
                  <p className="text-xs">{t("orders.noItemsSelectedToRemove")}</p>
                </div>
              ) : (
                itemsToRemove.map((item) => (
                  <div key={item.inventoryId} className="bg-red-50/50 p-3 rounded-xl border border-red-100 flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-semibold text-slate-800 text-sm truncate">{item.productName}</p>
                      <p className="text-[10px] text-red-500 font-bold">-{item.removeQuantity} UNITS</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">-{item.subtotalToRemove.toLocaleString()} MMK</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t("orders.tax")}</label>
                  <input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t("orders.discount")} (%)</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{t("orders.subTotal")}</span>
                  <span>{calculateTotals().subTotal.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800 pt-1 border-t">
                  <span>{t("orders.finalAmount")}</span>
                  <span className="text-primary">{calculateTotals().finalAmount.toLocaleString()} MMK</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || itemsToRemove.length === 0}
                  className="flex-[2] py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Minus className="w-5 h-5" />}
                  {t("orders.removeItems")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
