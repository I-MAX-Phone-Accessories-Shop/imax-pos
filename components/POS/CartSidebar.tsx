import React from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { CartUnitSelector } from "../UOM/CartUnitSelector";
import {
  getCartLineId,
  getCartLineUnitPrice,
  getCartLineMaxQty,
  getInventoryUomFromStock,
} from "../../utils/posCartUom";
import type { UomCartItem } from "../../utils/posCartUom";
import { ca } from "date-fns/locale";

interface CartSidebarProps {
  cart: UomCartItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentType: "paid" | "credit";
  onUpdateQty: (lineId: string, delta: number) => void;
  onSetQty: (lineId: string, qty: number) => void;
  onSetCartLineUnit: (lineId: string, unit: string) => void;
  onRemoveFromCart: (lineId: string) => void;
  onOpenCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  subtotal,
  total,
  paymentMethod,
  paymentType,
  onUpdateQty,
  onSetQty,
  onSetCartLineUnit,
  onRemoveFromCart,
  onOpenCheckout,
}) => {
  const { t } = useLanguage();
  console.log("cart", cart[0]?.stockItem?.inventoryId?.uomConversions);
  return (
    <div className="w-96 bg-white flex flex-col border-l border-[#E9ECEF] shadow-xl h-[calc(100vh-60px)] sticky top-0">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg">{t("pos.currentSale")}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            {t("pos.emptyCart")}
          </div>
        ) : (
          cart.map((item) => {
            const lineId = getCartLineId(item);
            const { baseUnit, conversions } = getInventoryUomFromStock(
              item.stockItem,
            );
            const unitPrice = getCartLineUnitPrice(item);
            const maxQty = getCartLineMaxQty(item);
            return (
              <div
                key={lineId}
                className="flex flex-col gap-2 border-b border-gray-200 pb-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {item.stockItem.inventoryId.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {unitPrice.toLocaleString()} MMK / {item.selectedUnit} ·{" "}
                      {(unitPrice * item.qty).toLocaleString()} MMK
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveFromCart(lineId)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CartUnitSelector
                    baseUnit={baseUnit}
                    conversions={conversions}
                    selectedUnit={item.selectedUnit}
                    onUnitChange={(unit) => onSetCartLineUnit(lineId, unit)}
                    availableQuantity={item.stockItem.availableQuantity}
                    quantityByUnit={item.stockItem.quantityByUnit}
                  />
                  <div className="cart-item-controls flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => onUpdateQty(lineId, -1)}
                      className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxQty}
                      value={item.qty}
                      onChange={(e) =>
                        onSetQty(lineId, parseInt(e.target.value) || 1)
                      }
                      onBlur={(e) => {
                        const v = parseInt(e.target.value) || 1;
                        if (v < 1) onSetQty(lineId, 1);
                      }}
                      className="text-sm font-medium w-12 text-center border border-gray-300 rounded px-1 py-1 focus:ring-2 focus:ring-primary focus:border-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-gray-500">
                      {item.selectedUnit}
                    </span>
                    <button
                      onClick={() => onUpdateQty(lineId, 1)}
                      className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-[#E9ECEF] bg-[#F8F9FA] space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("pos.items")}</span>
            <span>
              {cart.reduce((sum, i) => sum + i.qty, 0)} {t("pos.itemsLower")}
            </span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900">
            <span>{t("common.total")}</span>
            <span>{subtotal.toLocaleString()} MMK</span>
          </div>
        </div>
        <button
          onClick={onOpenCheckout}
          disabled={cart.length === 0}
          className="start-btn w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {t("pos.proceedToCheckout")}
        </button>
      </div>
    </div>
  );
};
