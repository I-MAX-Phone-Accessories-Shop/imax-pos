import React, { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2, Loader2, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import type { EcommerceOrder } from "../../services/Ecommerce/fetchEcommerceOrders";
import { addProductsToEcommerceOrder } from "../../services/Ecommerce/addProductsToEcommerceOrder";
import axios from "../../services/axios";
import { ConfirmModal } from "../Common/ConfirmModal";

interface InventoryOption {
  _id: string;
  productName: string;
  productCode: string;
  sellingPrice: number;
}

interface SelectedItem {
  inventoryId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPriceInput: string;
  defaultPrice: number;
}

interface AddItemsToEcommerceOrderModalProps {
  isOpen: boolean;
  order: EcommerceOrder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddItemsToEcommerceOrderModal: React.FC<
  AddItemsToEcommerceOrderModalProps
> = ({ isOpen, order, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<InventoryOption[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<
    | {
        products: Array<{ inventoryId: string; quantity: number; unitPrice?: number }>;
      }
    | null
  >(null);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedItems([]);
      return;
    }
    loadProducts();
  }, [isOpen]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await axios.get("inventory");
      const rows: any[] = response?.data?.data || [];
      const mapped: InventoryOption[] = rows.map((row) => ({
        _id: row._id || row.id,
        productName: row.productName || "",
        productCode: row.productCode || "",
        sellingPrice: Number(row.sellingPrice || 0),
      }));
      setProducts(mapped.filter((p) => !!p._id));
    } catch (error) {
      console.error("Error loading inventory products:", error);
      toast.error("Failed to load products");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q),
    );
  }, [products, search]);

  const addItem = (product: InventoryOption) => {
    const existing = selectedItems.find((s) => s.inventoryId === product._id);
    if (existing) {
      setSelectedItems((prev) =>
        prev.map((s) =>
          s.inventoryId === product._id ? { ...s, quantity: s.quantity + 1 } : s,
        ),
      );
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        inventoryId: product._id,
        productName: product.productName,
        productCode: product.productCode,
        quantity: 1,
        unitPriceInput: "",
        defaultPrice: product.sellingPrice,
      },
    ]);
  };

  const removeItem = (inventoryId: string) => {
    setSelectedItems((prev) => prev.filter((s) => s.inventoryId !== inventoryId));
  };

  const updateQuantity = (inventoryId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(inventoryId);
      return;
    }
    setSelectedItems((prev) =>
      prev.map((s) => (s.inventoryId === inventoryId ? { ...s, quantity } : s)),
    );
  };

  const updateUnitPriceInput = (inventoryId: string, unitPriceInput: string) => {
    setSelectedItems((prev) =>
      prev.map((s) =>
        s.inventoryId === inventoryId ? { ...s, unitPriceInput } : s,
      ),
    );
  };

  const buildPayload = () => {
    if (!order) return;
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    const productsPayload = selectedItems.map((item) => {
      const parsedPrice =
        item.unitPriceInput.trim() === ""
          ? undefined
          : Number(item.unitPriceInput);

      if (parsedPrice !== undefined && Number.isNaN(parsedPrice)) {
        toast.error("Invalid unit price");
        return null;
      }

      return {
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        ...(parsedPrice !== undefined ? { unitPrice: parsedPrice } : {}),
      };
    });

    const cleaned = productsPayload.filter(Boolean) as Array<{
      inventoryId: string;
      quantity: number;
      unitPrice?: number;
    }>;
    if (cleaned.length !== selectedItems.length) return;
    setPendingPayload({ products: cleaned });
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!order || !pendingPayload) return;

    setSubmitting(true);
    try {
      const response = await addProductsToEcommerceOrder(order._id, {
        action: "add",
        products: pendingPayload.products,
      });

      if (response.success) {
        toast.success(response.message || "Items added successfully");
        setConfirmOpen(false);
        setPendingPayload(null);
        onClose();
        setSelectedItems([]);
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || "Failed to add items");
      }
    } catch (error: any) {
      console.error("Error adding items to ecommerce order:", error);
      toast.error(error?.message || "Failed to add items");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/10 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            {t("orders.addItemsToOrder") || "Add Items to Order"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 border-r overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-slate-50">
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t("orders.selectProductsToAdd") || "Select Products to Add"}
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("orders.searchProducts") || "Search products..."}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-slate-500">
                    {t("orders.loadingProducts") || "Loading products..."}
                  </span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    {t("orders.noProductsFound") || "No products found"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => addItem(product)}
                      className="p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                    >
                      <p className="font-medium text-slate-800 text-sm">
                        {product.productName}
                      </p>
                      <p className="text-xs text-slate-500">{product.productCode}</p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        {product.sellingPrice.toLocaleString()} MMK
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />
              {t("orders.newItemsToAdd") || "New Items to Add"} (
              {selectedItems.length})
            </h4>
            {selectedItems.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">
                {t("orders.noItemsSelected") || "No items selected"}
              </p>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.inventoryId}
                    className="bg-slate-50 p-3 rounded-lg border flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">{item.productCode}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.inventoryId)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.inventoryId,
                              Math.max(1, Number(e.target.value) || 1),
                            )
                          }
                          className="w-full border rounded px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">
                          Unit Price (optional)
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder={item.defaultPrice.toString()}
                          value={item.unitPriceInput}
                          onChange={(e) =>
                            updateUnitPriceInput(item.inventoryId, e.target.value)
                          }
                          className="w-full border rounded px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-white flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            {t("common.cancel") || "Cancel"}
          </button>
          <button
            onClick={buildPayload}
            disabled={submitting || selectedItems.length === 0}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("orders.addingItems") || "Adding Items..."}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {t("orders.addItems") || "Add Items"}
              </>
            )}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title={t("orders.confirmAddItems") || "Confirm"}
        message="Add selected items to this order?"
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        confirmButtonColor="primary"
        isLoading={submitting}
        onCancel={() => {
          if (submitting) return;
          setConfirmOpen(false);
          setPendingPayload(null);
        }}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
};

