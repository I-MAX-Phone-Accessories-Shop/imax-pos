import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { OnlineOrder } from "../../services/OnlineStorefront/fetchOnlineOrders";
import {
  fetchOnlineStorefrontInventory,
  OnlineStorefrontStockItem,
} from "../../services/OnlineStorefront/fetchOnlineStorefrontInventory";
import { addOnlineOrderItems } from "../../services/OnlineStorefront/onlineOrderManagement";
import { useLanguage } from "../../context/LanguageContext";

interface InventoryProduct {
  _id: string;
  productName: string;
  productCode: string;
  sellingPrice: number;
  availableQuantity?: number;
}

interface SelectedItem {
  inventoryId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface AddItemsToOnlineOrderModalProps {
  isOpen: boolean;
  order: OnlineOrder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddItemsToOnlineOrderModal: React.FC<AddItemsToOnlineOrderModalProps> = ({
  isOpen,
  order,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [taxManuallyChanged, setTaxManuallyChanged] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      loadInventoryProducts();
      setTax(order.tax || 0);
      setDiscount(order.discount || 0);
      const subtotal = order.subTotal || 0;
      const calculatedPercent = subtotal > 0 ? Math.round((order.discount / subtotal) * 100 * 100) / 100 : 0;
      setDiscountPercent(calculatedPercent);
    } else {
      setSelectedItems([]);
      setSearchProduct("");
      setTax(0);
      setDiscount(0);
      setDiscountPercent(0);
      setTaxManuallyChanged(false);
    }
  }, [isOpen, order]);

  useEffect(() => {
    if (order) {
      const existingSubtotal = order.subTotal || 0;
      const existingTax = order.tax || 0;
      const newItemsSubtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const totalSubtotal = existingSubtotal + newItemsSubtotal;

      if (existingSubtotal > 0 && !taxManuallyChanged) {
        const calculatedTax = Math.max(0, Math.round(((totalSubtotal * existingTax) / existingSubtotal) * 100) / 100);
        setTax(calculatedTax);
      }
    }
  }, [selectedItems, order, taxManuallyChanged]);

  useEffect(() => {
    if (order) {
      const existingSubtotal = order.subTotal || 0;
      const newItemsSubtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const totalSubtotal = existingSubtotal + newItemsSubtotal;
      const calculatedDiscount = Math.max(0, Math.round(((totalSubtotal * discountPercent) / 100) * 100) / 100);
      setDiscount(calculatedDiscount);
    }
  }, [discountPercent, selectedItems, order]);

  const loadInventoryProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetchOnlineStorefrontInventory();
      if (response.success && response.data) {
        const products = response.data.map((item: OnlineStorefrontStockItem) => ({
          _id: item.inventoryId._id,
          productName: item.inventoryId.productName || "",
          productCode: item.inventoryId.productCode || "",
          sellingPrice: item.inventoryId.sellingPrice || 0,
          availableQuantity: item.quantity || 0,
        }));
        setInventoryProducts(products);
      }
    } catch (error) {
      console.error("Error loading online inventory:", error);
      toast.error(t("orders.failedToLoadProducts") || "Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = inventoryProducts.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchProduct.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const handleAddItem = (product: InventoryProduct) => {
    const existingItem = selectedItems.find((item) => item.inventoryId === product._id);
    if (existingItem) {
      setSelectedItems(selectedItems.map((item) =>
        item.inventoryId === product._id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        inventoryId: product._id,
        productName: product.productName,
        productCode: product.productCode,
        quantity: 1,
        unitPrice: product.sellingPrice,
        subtotal: product.sellingPrice,
      }]);
    }
  };

  const handleRemoveItem = (inventoryId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.inventoryId !== inventoryId));
  };

  const handleQuantityChange = (inventoryId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(inventoryId);
      return;
    }
    setSelectedItems(selectedItems.map((item) =>
      item.inventoryId === inventoryId
        ? { ...item, quantity, subtotal: quantity * item.unitPrice }
        : item
    ));
  };

  const calculateTotals = () => {
    const newItemsSubtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalSubtotal = (order?.subTotal || 0) + newItemsSubtotal;
    const finalAmount = totalSubtotal + tax - discount;
    return { subTotal: totalSubtotal, tax, discount, finalAmount };
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error(t("orders.noItemsSelected") || "Please select at least one item");
      return;
    }
    if (!order) return;

    setSubmitting(true);
    try {
      const totals = calculateTotals();
      const payload = {
        items: selectedItems.map((item) => ({
          inventoryId: item.inventoryId,
          quantity: item.quantity,
        })),
        ...totals,
      };

      const response = await addOnlineOrderItems(order._id, payload);
      if (response.success) {
        toast.success(t("orders.itemsAddedSuccess") || "Items added successfully");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || "Failed to add items");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add items");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col font-sans">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            {t("orders.addItemsToOrder")}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Product Selection */}
          <div className="flex-1 border-r flex flex-col min-h-0">
            <div className="p-4 bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("orders.searchProducts")}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {t("orders.noProductsFound")}
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleAddItem(product)}
                    disabled={product.availableQuantity === 0}
                    className="w-full p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-slate-800 text-sm">{product.productName}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${product.availableQuantity! > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {product.availableQuantity} {t("orders.inStock")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{product.productCode}</p>
                    <p className="text-sm font-bold text-primary mt-1">{product.sellingPrice.toLocaleString()} MMK</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Selected Items & Summary */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <h4 className="font-bold text-slate-700 text-sm">{t("orders.newItemsToAdd")} ({selectedItems.length})</h4>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                  <Package className="w-8 h-8 opacity-20" />
                  <p className="text-xs">{t("orders.noItemsSelected")}</p>
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.inventoryId} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-semibold text-slate-800 text-sm truncate">{item.productName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.productCode}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => handleQuantityChange(item.inventoryId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-primary transition-colors">-</button>
                        <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => handleQuantityChange(item.inventoryId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-primary transition-colors">+</button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-sm font-bold text-slate-800">{item.subtotal.toLocaleString()}</p>
                      </div>
                      <button onClick={() => handleRemoveItem(item.inventoryId)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
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
                    onChange={(e) => { setTax(Number(e.target.value)); setTaxManuallyChanged(true); }}
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

              <button
                onClick={handleSubmit}
                disabled={submitting || selectedItems.length === 0}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {t("orders.addItems")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
