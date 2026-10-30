import React from "react";
import { Plus, Minus, Trash2, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { StorefrontStockItem } from "../../services/Storefront/fetchStorefrontStock";

export interface CartPanelItem {
  stockItem: StorefrontStockItem;
  qty: number;
}

interface CartPanelProps {
  cart: CartPanelItem[];
  storefrontName?: string;
  subtotal: number;
  itemCount: number;
  getItemPrice: (item: StorefrontStockItem) => number;
  onUpdateQty: (id: string, delta: number) => void;
  onSetQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  // "sidebar": desktop column; "sheet": mobile bottom sheet (bigger tap targets)
  variant: "sidebar" | "sheet";
  onClose?: () => void;
}

// Header, cart list, summary and checkout button shared by the desktop
// sidebar and the mobile bottom sheet
export const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  storefrontName,
  subtotal,
  itemCount,
  getItemPrice,
  onUpdateQty,
  onSetQty,
  onRemove,
  onCheckout,
  variant,
  onClose,
}) => {
  const { t } = useLanguage();
  const isSheet = variant === "sheet";

  const qtyButtonClass = isSheet
    ? "w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors"
    : "p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors";
  const qtyIconClass = isSheet ? "w-4 h-4" : "w-3 h-3";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div
        className={`p-4 border-b ${isSheet ? "pt-2 flex items-start justify-between gap-3" : ""}`}
      >
        <div>
          <h2 className="font-bold text-lg">{t("pos.currentSale")}</h2>
          {storefrontName && (
            <p className="text-xs text-gray-400 mt-1">{storefrontName}</p>
          )}
        </div>
        {isSheet && onClose && (
          <button
            onClick={onClose}
            aria-label={t("pos.closeCart")}
            className="w-10 h-10 -mr-2 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            {t("pos.emptyCart")}
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.stockItem._id}
              className="flex justify-between items-start border-b border-gray-200 pb-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {item.stockItem.inventoryId.productName}
                </p>
                <p className="text-xs text-gray-500">
                  {(getItemPrice(item.stockItem) * item.qty).toLocaleString()}{" "}
                  MMK
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => onUpdateQty(item.stockItem._id, -1)}
                  className={qtyButtonClass}
                >
                  <Minus className={qtyIconClass} />
                </button>
                <input
                  type="number"
                  min="1"
                  max={item.stockItem.availableQuantity}
                  value={item.qty}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    onSetQty(item.stockItem._id, value);
                  }}
                  onBlur={(e) => {
                    // Ensure quantity is at least 1 when input loses focus
                    const value = parseInt(e.target.value) || 1;
                    if (value < 1) {
                      onSetQty(item.stockItem._id, 1);
                    }
                  }}
                  className={`text-sm font-medium text-center border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    isSheet ? "w-14 h-10 px-1" : "w-12 px-1 py-1"
                  }`}
                />
                <button
                  onClick={() => onUpdateQty(item.stockItem._id, 1)}
                  className={qtyButtonClass}
                >
                  <Plus className={qtyIconClass} />
                </button>
                <button
                  onClick={() => onRemove(item.stockItem._id)}
                  className={
                    isSheet
                      ? "w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg ml-1 transition-colors"
                      : "p-1 text-red-500 hover:bg-red-50 rounded ml-2 transition-colors"
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout Button */}
      <div
        className={`p-4 border-t border-gray-200 bg-gray-50 space-y-3 ${
          isSheet ? "pb-[calc(1rem+env(safe-area-inset-bottom))]" : ""
        }`}
      >
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("pos.items")}</span>
            <span>
              {itemCount} {t("pos.itemsLower")}
            </span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900">
            <span>{t("common.total")}</span>
            <span>{subtotal.toLocaleString()} MMK</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full bg-btn-primary hover:bg-btn-primary-hover text-dark py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {t("pos.proceedToCheckout")}
        </button>
      </div>
    </div>
  );
};
