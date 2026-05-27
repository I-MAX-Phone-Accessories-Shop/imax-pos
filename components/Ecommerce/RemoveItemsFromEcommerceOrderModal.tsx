import React, { useEffect, useMemo, useState } from "react";
import { X, Minus, Trash2, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import type { EcommerceOrder } from "../../services/Ecommerce/fetchEcommerceOrders";
import { ConfirmModal } from "../Common/ConfirmModal";
import { removeProductsFromEcommerceOrder } from "../../services/Ecommerce/removeProductsFromEcommerceOrder";

type OrderLine = {
  lineKey: string;
  inventoryId: string;
  productName: string;
  productCode: string;
  currentQuantity: number;
  removeQuantity: number;
  unitPrice: number;
};

interface RemoveItemsFromEcommerceOrderModalProps {
  isOpen: boolean;
  order: EcommerceOrder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RemoveItemsFromEcommerceOrderModal: React.FC<
  RemoveItemsFromEcommerceOrderModalProps
> = ({ isOpen, order, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !order) {
      setLines([]);
      setSubmitting(false);
      setConfirmOpen(false);
      return;
    }

    const initial: OrderLine[] =
      order.products?.map((p, idx) => {
        // ecommerce response doesn't guarantee a line _id, so use stable key
        const inv: any = p.inventoryId as any;
        const inventoryId =
          typeof inv === "string" ? inv : (inv?._id as string | undefined);
        return {
          lineKey: `${inventoryId || inv?.productCode || idx}`,
          inventoryId: inventoryId || "",
          productName: inv?.productName || "-",
          productCode: inv?.productCode || "-",
          currentQuantity: Number(p.quantity || 0),
          removeQuantity: 0,
          unitPrice: Number(p.unitPrice || 0),
        };
      }) || [];

    setLines(initial.filter((l) => !!l.inventoryId && l.currentQuantity > 0));
  }, [isOpen, order]);

  const itemsToRemove = useMemo(
    () => lines.filter((l) => l.removeQuantity > 0),
    [lines],
  );

  const handleQuantityChange = (lineKey: string, nextQty: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.lineKey !== lineKey) return l;
        const valid = Math.max(0, Math.min(nextQty, l.currentQuantity));
        return { ...l, removeQuantity: valid };
      }),
    );
  };

  const clearLine = (lineKey: string) => handleQuantityChange(lineKey, 0);

  const openConfirm = () => {
    if (!order) return;
    if (itemsToRemove.length === 0) {
      toast.error(
        t("orders.noItemsSelectedToRemove") || "Please select items to remove",
      );
      return;
    }
    setConfirmOpen(true);
  };

  const onConfirmRemove = async () => {
    if (!order) return;
    if (itemsToRemove.length === 0) return;

    setSubmitting(true);
    try {
      const response = await removeProductsFromEcommerceOrder(order._id, {
        action: "remove",
        products: itemsToRemove.map((l) => ({
          inventoryId: l.inventoryId,
          quantity: l.removeQuantity,
        })),
      });

      if (response.success) {
        toast.success(response.message || t("orders.itemsRemovedSuccess"));
        setConfirmOpen(false);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || t("orders.failedToRemoveItems"));
      }
    } catch (error: any) {
      console.error("Error removing ecommerce order items:", error);
      toast.error(error?.message || t("orders.failedToRemoveItems"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/10 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
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

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left column: current items */}
          <div className="flex-1 border-r overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-slate-50">
              <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t("orders.currentOrderItems") || "Current Order Items"} (
                {lines.length})
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {lines.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    {t("orders.noItemsInOrder") || "No items in this order"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lines.map((l) => (
                    <div
                      key={l.lineKey}
                      className="bg-slate-50 p-3 rounded-lg border"
                    >
                      <div className="mb-2">
                        <p className="font-medium text-slate-800 text-sm">
                          {l.productName}
                        </p>
                        <p className="text-xs text-slate-500">{l.productCode}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("orders.currentQuantity") || "Current Qty"}:{" "}
                            <span className="font-medium text-slate-700">
                              {l.currentQuantity}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {t("orders.unitPrice") || "Unit Price"}:{" "}
                            <span className="font-medium text-slate-700">
                              {l.unitPrice.toLocaleString()} MMK
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleQuantityChange(l.lineKey, l.removeQuantity - 1)
                              }
                              disabled={l.removeQuantity <= 0}
                              className="w-6 h-6 rounded border flex items-center justify-center hover:bg-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={l.currentQuantity}
                              value={l.removeQuantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  l.lineKey,
                                  Number(e.target.value) || 0,
                                )
                              }
                              className="w-16 text-center border rounded py-1 text-sm"
                            />
                            <button
                              onClick={() =>
                                handleQuantityChange(l.lineKey, l.removeQuantity + 1)
                              }
                              disabled={l.removeQuantity >= l.currentQuantity}
                              className="w-6 h-6 rounded border flex items-center justify-center hover:bg-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: items to remove */}
          <div className="flex-1 overflow-hidden flex flex-col">
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
                  {itemsToRemove.map((l) => (
                    <div
                      key={l.lineKey}
                      className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {l.productName}
                        </p>
                        <p className="text-xs text-slate-500">{l.productCode}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right min-w-[120px]">
                          <p className="font-medium text-red-600 text-sm">
                            -{l.removeQuantity} x {l.unitPrice.toLocaleString()}
                          </p>
                          <p className="font-medium text-red-600 text-sm">
                            -{(l.removeQuantity * l.unitPrice).toLocaleString()} MMK
                          </p>
                        </div>
                        <button
                          onClick={() => clearLine(l.lineKey)}
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

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button
                  onClick={openConfirm}
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

      <ConfirmModal
        isOpen={confirmOpen}
        title={t("orders.removeItemsFromOrder") || "Remove Items"}
        message="Are you sure you want to remove the selected quantities from this order?"
        confirmText={t("orders.confirmRemoveItems") || t("common.confirm")}
        cancelText={t("common.cancel")}
        confirmButtonColor="red"
        isLoading={submitting}
        onCancel={() => {
          if (submitting) return;
          setConfirmOpen(false);
        }}
        onConfirm={onConfirmRemove}
      />
    </div>
  );
};

