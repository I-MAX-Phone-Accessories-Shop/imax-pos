import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  Box,
  RefreshCw,
  ArrowRightLeft,
  X,
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchWarehouseStock,
  WarehouseStockItem,
} from "../services/Warehouse/fetchWarehouseStock";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  createWarehouseTransfer,
  TransferLineItem,
} from "../services/Warehouse/createWarehouseTransfer";
import {
  updateWarehouseStockQuantity,
  UpdateWarehouseStockQuantityPayload,
} from "../services/Warehouse/updateWarehouseStockQuantity";

interface TransferFormItem {
  productCode: string;
  productName: string;
  quantity: number;
  maxQuantity: number;
  notes: string;
}

export const WarehouseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get warehouse info from location state if available
  const warehouseInfo = location.state as {
    warehouseName?: string;
    warehouseCode?: string;
  } | null;

  const [stockItems, setStockItems] = useState<WarehouseStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseName, setWarehouseName] = useState(
    warehouseInfo?.warehouseName || "Warehouse"
  );
  const [warehouseCode, setWarehouseCode] = useState(
    warehouseInfo?.warehouseCode || ""
  );

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState("");
  const [transferItems, setTransferItems] = useState<TransferFormItem[]>([]);
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [transferNotes, setTransferNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stock Adjustment Modal State
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] =
    useState<WarehouseStockItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">(
    "increase"
  );
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    loadWarehouseStock();
    loadStorefronts();
  }, [id]);

  const loadWarehouseStock = async () => {
    setLoading(true);
    try {
      const response = await fetchWarehouseStock();
      console.log(response);
      if (response.success && response.data) {
        // Filter items by warehouse ID
        const filteredItems = response.data.filter(
          (item) => item.warehouseId !== null && item.warehouseId._id === id
        );
        setStockItems(filteredItems);

        // Update warehouse info from first item if not provided via state
        if (filteredItems.length > 0 && !warehouseInfo) {
          setWarehouseName(filteredItems[0].warehouseId.warehouseName);
          setWarehouseCode(filteredItems[0].warehouseId.warehouseCode);
        }
      } else {
        toast.error("Failed to load warehouse stock");
      }
    } catch (error) {
      console.error("Error loading warehouse stock:", error);
      toast.error("Failed to load warehouse stock");
    } finally {
      setLoading(false);
    }
  };

  const loadStorefronts = async () => {
    try {
      const response = await fetchStorefrontProfiles();
      if (response.success && response.data) {
        setStorefronts(response.data.filter((s) => s.status === "active"));
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    }
  };

  const totalQuantity = stockItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const lowStockCount = stockItems.filter((item) => item.isLowStock).length;

  // Calculate total amount for each item and warehouse total
  const totalWarehouseAmount = stockItems.reduce((sum, item) => {
    const sellingPrice = item.inventoryId.sellingPrice || 0;
    const itemTotal = item.quantity * sellingPrice;
    return sum + itemTotal;
  }, 0);

  // Transfer Modal Functions
  const openTransferModal = (item?: WarehouseStockItem) => {
    if (item) {
      // Pre-populate with clicked item
      setTransferItems([
        {
          productCode: item.inventoryId.productCode,
          productName: item.inventoryId.productName,
          quantity: 1,
          maxQuantity: item.availableQuantity,
          notes: "",
        },
      ]);
    } else {
      setTransferItems([]);
    }
    setSelectedStorefrontId("");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setTransferNotes("");
    setIsTransferModalOpen(true);
  };

  const addTransferItem = () => {
    // Get available products (not already in transfer list)
    const usedCodes = transferItems.map((i) => i.productCode);
    const availableProducts = stockItems.filter(
      (item) =>
        !usedCodes.includes(item.inventoryId.productCode) &&
        item.availableQuantity > 0
    );

    if (availableProducts.length === 0) {
      toast.error("No more products available to add");
      return;
    }

    const firstAvailable = availableProducts[0];
    setTransferItems([
      ...transferItems,
      {
        productCode: firstAvailable.inventoryId.productCode,
        productName: firstAvailable.inventoryId.productName,
        quantity: 1,
        maxQuantity: firstAvailable.availableQuantity,
        notes: "",
      },
    ]);
  };

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const updateTransferItem = (
    index: number,
    field: keyof TransferFormItem,
    value: string | number
  ) => {
    const updated = [...transferItems];

    if (field === "productCode") {
      // Find the stock item for this product code
      const stockItem = stockItems.find(
        (item) => item.inventoryId.productCode === value
      );
      if (stockItem) {
        updated[index] = {
          ...updated[index],
          productCode: value as string,
          productName: stockItem.inventoryId.productName,
          maxQuantity: stockItem.availableQuantity,
          quantity: Math.min(
            updated[index].quantity,
            stockItem.availableQuantity
          ),
        };
      }
    } else if (field === "quantity") {
      const qty = Math.max(
        1,
        Math.min(Number(value), updated[index].maxQuantity)
      );
      updated[index] = { ...updated[index], quantity: qty };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    setTransferItems(updated);
  };

  const handleSubmitTransfer = async () => {
    if (!selectedStorefrontId) {
      toast.error("Please select a destination storefront");
      return;
    }

    if (transferItems.length === 0) {
      toast.error("Please add at least one product to transfer");
      return;
    }

    // Validate quantities
    for (const item of transferItems) {
      if (item.quantity <= 0) {
        toast.error(`Quantity for ${item.productName} must be greater than 0`);
        return;
      }
      if (item.quantity > item.maxQuantity) {
        toast.error(
          `Quantity for ${item.productName} exceeds available stock (${item.maxQuantity})`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const lineItems: TransferLineItem[] = transferItems.map((item) => ({
        productCode: item.productCode,
        quantity: item.quantity,
        ...(item.notes && { notes: item.notes }),
      }));

      const result = await createWarehouseTransfer({
        sourceType: "Warehouse",
        sourceWarehouseId: id!,
        destinationStorefrontId: selectedStorefrontId,
        lineItems,
        transferDate,
        ...(transferNotes && { notes: transferNotes }),
      });

      if (result.success) {
        toast.success("Transfer created successfully!");
        setIsTransferModalOpen(false);
        loadWarehouseStock(); // Refresh stock
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available products for dropdown (not already selected)
  const getAvailableProductsForItem = (currentCode: string) => {
    const usedCodes = transferItems
      .map((i) => i.productCode)
      .filter((code) => code !== currentCode);
    return stockItems.filter(
      (item) =>
        !usedCodes.includes(item.inventoryId.productCode) &&
        item.availableQuantity > 0
    );
  };

  // Stock Adjustment Functions
  const openAdjustmentModal = (
    item: WarehouseStockItem,
    type: "increase" | "decrease"
  ) => {
    setSelectedStockItem(item);
    setAdjustmentType(type);
    setAdjustmentQuantity(0);
    setAdjustmentReason("");
    setIsAdjustmentModalOpen(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedStockItem) return;

    if (adjustmentQuantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    // For decrease, check if quantity is available
    if (
      adjustmentType === "decrease" &&
      adjustmentQuantity > selectedStockItem.quantity
    ) {
      toast.error(
        `Cannot decrease by ${adjustmentQuantity}. Available quantity is ${selectedStockItem.quantity}`
      );
      return;
    }

    setIsAdjusting(true);
    try {
      const quantityChange =
        adjustmentType === "increase"
          ? adjustmentQuantity
          : -adjustmentQuantity;

      const payload: UpdateWarehouseStockQuantityPayload = {
        quantityChange,
        reason: adjustmentReason.trim() || "",
      };

      const result = await updateWarehouseStockQuantity(
        selectedStockItem._id,
        payload
      );

      if (result.success) {
        toast.success(
          `Stock ${
            adjustmentType === "increase" ? "increased" : "decreased"
          } successfully!`
        );
        setIsAdjustmentModalOpen(false);
        setSelectedStockItem(null);
        setAdjustmentQuantity(0);
        setAdjustmentReason("");
        loadWarehouseStock(); // Refresh stock
      } else {
        toast.error(result.message || "Failed to update stock quantity");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock quantity");
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/warehouse")}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            {warehouseName}
            {warehouseCode && (
              <span className="text-sm px-2 py-1 bg-primary/20 text-blue-700 rounded-full font-medium">
                {warehouseCode}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Warehouse Stock Inventory
          </p>
        </div>
        <button
          onClick={() => openTransferModal()}
          disabled={stockItems.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-btn-primary hover:bg-btn-primary-hover text-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Transfer to Storefront
        </button>
        <button
          onClick={loadWarehouseStock}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Box className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Products</p>
              <p className="text-2xl font-bold text-slate-800">
                {stockItems.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Quantity</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalQuantity}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-slate-800">
                {lowStockCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="text-2xl font-bold text-indigo-600">
                {totalWarehouseAmount.toLocaleString()} MMK
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="font-semibold text-slate-800">Stock Items</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading stock items...
          </div>
        ) : stockItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No stock items found in this warehouse.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Product Name
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Product Code
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">SKU</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Category
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">
                  Quantity
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">
                  Available
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">
                  Selling Price
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">
                  Total Amount
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stockItems.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {item.inventoryId.productName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                      {item.inventoryId.productCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                    {item.inventoryId.SKU}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                      {item.inventoryId.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {item.availableQuantity}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {(item.inventoryId.sellingPrice || 0).toLocaleString()} MMK
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {(
                      item.quantity * (item.inventoryId.sellingPrice || 0)
                    ).toLocaleString()}{" "}
                    MMK
                  </td>
                  <td className="px-4 py-3">
                    {item.isLowStock ? (
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    ) : item.quantity === 0 ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openTransferModal(item)}
                        disabled={item.availableQuantity === 0}
                        className="text-xs bg-purple-50 text-primary-600 px-3 py-1.5 rounded hover:bg-purple-100 border border-purple-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Transfer
                      </button>
                      <button
                        onClick={() => openAdjustmentModal(item, "increase")}
                        className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-1"
                        title="Increase Stock"
                      >
                        <TrendingUp className="w-3 h-3" /> +
                      </button>
                      <button
                        onClick={() => openAdjustmentModal(item, "decrease")}
                        disabled={item.quantity === 0}
                        className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 border border-red-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Decrease Stock"
                      >
                        <TrendingDown className="w-3 h-3" /> -
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2">
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-4 font-bold text-slate-800 text-right"
                >
                  Total:
                </td>
                <td className="px-4 py-4 text-right font-bold text-slate-800">
                  {totalQuantity}
                </td>
                <td className="px-4 py-4 text-right font-medium text-slate-600">
                  -
                </td>
                <td className="px-4 py-4 text-right font-medium text-slate-600">
                  -
                </td>
                <td className="px-4 py-4 text-right font-bold text-indigo-600 text-lg">
                  {totalWarehouseAmount.toLocaleString()} MMK
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary-600" />
                Transfer to Storefront
              </h2>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Source Warehouse Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  Source Warehouse
                </p>
                <p className="text-lg font-bold text-blue-800">
                  {warehouseName}{" "}
                  <span className="text-sm font-normal">({warehouseCode})</span>
                </p>
              </div>

              {/* Destination Storefront */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Destination Storefront <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  value={selectedStorefrontId}
                  onChange={(e) => setSelectedStorefrontId(e.target.value)}
                >
                  <option value="">Select Storefront...</option>
                  {storefronts.map((sf) => (
                    <option key={sf._id} value={sf._id}>
                      {sf.locationName} ({sf.locationCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-700">
                    Products to Transfer <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={addTransferItem}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                {transferItems.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-slate-400">
                    <p>No products added yet.</p>
                    <button
                      onClick={addTransferItem}
                      className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add your first product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transferItems.map((item, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-slate-50"
                      >
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-5">
                            <label className="block text-xs text-slate-500 mb-1">
                              Product
                            </label>
                            <select
                              className="w-full border rounded p-2 text-sm"
                              value={item.productCode}
                              onChange={(e) =>
                                updateTransferItem(
                                  index,
                                  "productCode",
                                  e.target.value
                                )
                              }
                            >
                              {getAvailableProductsForItem(
                                item.productCode
                              ).map((stockItem) => (
                                <option
                                  key={stockItem.inventoryId.productCode}
                                  value={stockItem.inventoryId.productCode}
                                >
                                  {stockItem.inventoryId.productName} (
                                  {stockItem.inventoryId.productCode})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">
                              Qty (max: {item.maxQuantity})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={item.maxQuantity}
                              className="w-full border rounded p-2 text-sm"
                              value={item.quantity}
                              onChange={(e) =>
                                updateTransferItem(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-span-4">
                            <label className="block text-xs text-slate-500 mb-1">
                              Notes (optional)
                            </label>
                            <input
                              type="text"
                              className="w-full border rounded p-2 text-sm"
                              placeholder="Item notes..."
                              value={item.notes}
                              onChange={(e) =>
                                updateTransferItem(
                                  index,
                                  "notes",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col-span-1 flex items-end justify-center">
                            <button
                              onClick={() => removeTransferItem(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transfer Date & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Transfer Date
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Transfer notes..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTransfer}
                  disabled={isSubmitting || transferItems.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" /> Create Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustmentModalOpen && selectedStockItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {adjustmentType === "increase" ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                {adjustmentType === "increase"
                  ? "Increase Stock"
                  : "Decrease Stock"}
              </h2>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product Info */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Product</p>
                <p className="font-bold text-slate-800">
                  {selectedStockItem.inventoryId.productName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedStockItem.inventoryId.productCode} | Current
                  Quantity: {selectedStockItem.quantity}
                </p>
              </div>

              {/* Adjustment Type Info */}
              <div
                className={`p-3 rounded-lg ${
                  adjustmentType === "increase"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p className="text-sm font-medium">
                  {adjustmentType === "increase"
                    ? "This will increase the stock quantity"
                    : "This will decrease the stock quantity"}
                </p>
                {adjustmentType === "decrease" && (
                  <p className="text-xs text-red-600 mt-1">
                    Available to decrease: {selectedStockItem.quantity}
                  </p>
                )}
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity to {adjustmentType === "increase" ? "Add" : "Remove"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    adjustmentType === "decrease"
                      ? selectedStockItem.quantity
                      : undefined
                  }
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter quantity"
                  value={adjustmentQuantity || ""}
                  onChange={(e) =>
                    setAdjustmentQuantity(Number(e.target.value) || 0)
                  }
                />
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter reason for stock adjustment (optional)..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAdjustment}
                  disabled={isAdjusting || adjustmentQuantity <= 0}
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
                    adjustmentType === "increase"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isAdjusting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      {adjustmentType === "increase" ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}{" "}
                      {adjustmentType === "increase"
                        ? "Increase Stock"
                        : "Decrease Stock"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
