import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
  Shield,
  ArrowRightLeft,
  AlertTriangle,
  Box,
  RefreshCw,
  DollarSign,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchProductById,
  ProductDetail,
} from "../services/Inventory/fetchProductById";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import { updateStorefrontStockQuantity } from "../services/Storefront/updateStorefrontStockQuantity";
import {
  updateInventoryEcommerceLimit,
  removeEcommerceLimit,
  EcommercePurchaseResetMode,
} from "../services/Inventory/updateInventoryEcommerceLimit";
import { QuantityByUnitDisplay } from "../components/UOM/QuantityByUnitDisplay";
import { getUnitOptions } from "../utils/uom";

export const StorefrontProductDetail: React.FC = () => {
  const { storeId, productId } = useParams<{
    storeId: string;
    productId: string;
  }>();
  const navigate = useNavigate();

  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [stockItem, setStockItem] = useState<StorefrontStockItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Stock adjustment modal state
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">(
    "increase",
  );
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentUnit, setAdjustmentUnit] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Ecommerce limit modal state
  const [isEcommerceLimitModalOpen, setIsEcommerceLimitModalOpen] =
    useState(false);
  const [ecommerceMaxPerUser, setEcommerceMaxPerUser] = useState(1);
  const [resetMode, setResetMode] =
    useState<EcommercePurchaseResetMode>("manual");
  const [resetDays, setResetDays] = useState(7);
  const [limitUnit, setLimitUnit] = useState("");
  const [isSavingEcommerceLimit, setIsSavingEcommerceLimit] = useState(false);

  useEffect(() => {
    loadData();
  }, [storeId, productId]);

  const loadData = async () => {
    if (!storeId || !productId) return;
    setLoading(true);
    try {
      // Fetch product details
      const productRes = await fetchProductById(productId);
      if (productRes.success && productRes.data) {
        setProduct(productRes.data);

        setAdjustmentUnit(productRes.data.unitOfMeasure || "");
        console.log(productRes.data.unitOfMeasure);
      }

      // Fetch stock item for this product in this storefront
      const stockRes = await fetchStorefrontStock(
        storeId,
        1,
        100,
        undefined,
        productRes.data?.productCode,
      );
      if (stockRes.success && stockRes.data.length > 0) {
        setStockItem(stockRes.data[0]);
      }
    } catch (error) {
      console.error("Failed to load product data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  // Stock adjustment handlers
  const openAdjustmentModal = (type: "increase" | "decrease") => {
    setAdjustmentType(type);
    setAdjustmentQuantity(0);
    setAdjustmentReason("");
    setIsAdjustmentModalOpen(true);
  };

  const handleSubmitAdjustment = async () => {
    console.log("api", adjustmentUnit);
    console.log("local", product?.unitOfMeasure);
    console.log("unit", adjustmentUnit);
    if (!stockItem || adjustmentQuantity <= 0) return;

    setIsAdjusting(true);
    try {
      const payload = {
        quantityChange:
          adjustmentType === "increase"
            ? adjustmentQuantity
            : -adjustmentQuantity,
        unit: adjustmentUnit || product?.unitOfMeasure,
        reason: adjustmentReason,
      };
      const result = await updateStorefrontStockQuantity(
        stockItem._id,
        payload,
      );
      if (result.success) {
        toast.success(
          `Stock ${adjustmentType === "increase" ? "increased" : "decreased"} successfully`,
        );
        setIsAdjustmentModalOpen(false);
        loadData();
      } else {
        toast.error(result.message || "Failed to update stock");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Ecommerce limit handlers
  const openEcommerceLimitModal = () => {
    if (product) {
      setEcommerceMaxPerUser(product.ecommerceMaxPerUser ?? 1);
      setResetMode(product.ecommercePurchaseResetMode ?? "manual");
      setResetDays(product.ecommercePurchaseResetDays ?? 7);
      setLimitUnit(product.limitUnit ?? "");
    }
    setIsEcommerceLimitModalOpen(true);
  };

  const handleSaveEcommerceLimit = async () => {
    if (!productId) return;

    if (ecommerceMaxPerUser <= 0) {
      toast.error("Max per user must be greater than 0");
      return;
    }

    if (resetMode === "timeline" && resetDays < 1) {
      toast.error("Reset days must be at least 1");
      return;
    }

    setIsSavingEcommerceLimit(true);
    try {
      const limitUnitPayload =
        limitUnit && limitUnit.trim() ? { limitUnit: limitUnit.trim() } : {};
      const payload =
        resetMode === "manual"
          ? {
              ecommerceMaxPerUser,
              ecommercePurchaseResetMode: "manual" as const,
              ...limitUnitPayload,
            }
          : {
              ecommerceMaxPerUser,
              ecommercePurchaseResetMode: "timeline" as const,
              ecommercePurchaseResetDays: resetDays,
              ...limitUnitPayload,
            };

      const result = await updateInventoryEcommerceLimit(productId, payload);
      if (result.success) {
        toast.success("Ecommerce limit updated");
        setIsEcommerceLimitModalOpen(false);
        loadData();
      } else {
        toast.error(result.message || "Failed to update ecommerce limit");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update ecommerce limit";
      toast.error(message);
    } finally {
      setIsSavingEcommerceLimit(false);
    }
  };

  const handleRemoveEcommerceLimit = async () => {
    if (!productId) return;

    try {
      const result = await removeEcommerceLimit(productId);
      if (result.success) {
        toast.success("Ecommerce limit removed");
        loadData();
      } else {
        toast.error(result.message || "Failed to remove ecommerce limit");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to remove ecommerce limit";
      toast.error(message);
    }
  };

  // Transfer handler
  const handleTransfer = () => {
    navigate(`/storefront/${storeId}`, {
      state: { openTransfer: true, productId },
    });
  };

  // Format ecommerce limit for display
  const formatEcommerceLimit = () => {
    if (!product) return "—";
    if (product.ecommerceMaxPerUser == null || product.ecommerceMaxPerUser <= 0)
      return "—";
    const unitLabel = product.limitUnit ? ` ${product.limitUnit}` : "";
    if (
      product.ecommercePurchaseResetMode === "timeline" &&
      product.ecommercePurchaseResetDays
    ) {
      return `${product.ecommerceMaxPerUser}${unitLabel} / ${product.ecommercePurchaseResetDays}d`;
    }
    if (product.ecommercePurchaseResetMode === "manual") {
      return `${product.ecommerceMaxPerUser}${unitLabel} / manual`;
    }
    return `${product.ecommerceMaxPerUser}${unitLabel}`;
  };

  // Get unit options for adjustment
  const getAdjustmentUnitOptions = () => {
    if (!product) return [{ value: "piece", label: "piece", isBase: true }];
    const baseUnit = product.unitOfMeasure || "piece";
    return getUnitOptions(baseUnit, product.uomConversions);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-slate-500">
            Loading product details...
          </span>
        </div>
      </div>
    );
  }

  if (!product || !stockItem) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/storefront/${storeId}`)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">
            Product Not Found
          </h1>
        </div>
        <div className="text-center py-12 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>This product is not available in this storefront.</p>
          <button
            onClick={() => navigate(`/storefront/${storeId}`)}
            className="mt-4 text-primary hover:underline"
          >
            Back to Storefront
          </button>
        </div>
      </div>
    );
  }

  const isLowStock = stockItem.isLowStock;
  const isOutOfStock = stockItem.quantity === 0;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate(`/storefront/${storeId}`)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
              <span className="truncate">{product.productName}</span>
              {product.productCode && (
                <span className="text-xs sm:text-sm px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-mono flex-shrink-0">
                  {product.productCode}
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {product.category} ·{" "}
              {stockItem.storefrontId?.locationName || "Storefront"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Box className="w-4 h-4" />
            Quantity
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">
            <QuantityByUnitDisplay
              quantity={stockItem.quantity}
              quantityByUnit={stockItem.quantityByUnit}
            />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Available
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">
            {stockItem.availableQuantity.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Price
          </div>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {(product.sellingPrice || 0).toLocaleString()} MMK
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Tag className="w-4 h-4" />
            Status
          </div>
          <div className="mt-1">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3 h-3" /> Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3 h-3" /> Low Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                <Package className="w-3 h-3" /> In Stock
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Product Info Card */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Information
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Product Name</p>
                <p className="font-medium text-slate-800 truncate">
                  {product.productName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Product Code</p>
                <p className="font-medium text-slate-800 font-mono">
                  {product.productCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">SKU</p>
                <p className="font-medium text-slate-800">
                  {product.SKU || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Category</p>
                <p className="font-medium text-slate-800">
                  {product.category || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Base Unit</p>
                <p className="font-medium text-slate-800">
                  {product.unitOfMeasure || "piece"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Selling Price</p>
                <p className="font-medium text-green-600">
                  {(product.sellingPrice || 0).toLocaleString()} MMK
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Buying Price</p>
                <p className="font-medium text-slate-800">
                  {(product.buyingPrice || 0).toLocaleString()} MMK
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Profit</p>
                <p className="font-medium text-slate-800">
                  {(
                    (product.sellingPrice || 0) - (product.buyingPrice || 0)
                  ).toLocaleString()}{" "}
                  MMK
                  {product.sellingPrice ? (
                    <span className="text-xs text-slate-500 ml-1">
                      ({(product.profitMargin || 0).toFixed(1)}%)
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            {product.description && (
              <div className="pt-2 border-t">
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-700">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stock Info Card */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Box className="w-4 h-4" />
              Stock Information
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Current Quantity</p>
                <p className="font-bold text-xl text-slate-800">
                  {stockItem.quantity.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Available Quantity</p>
                <p className="font-bold text-xl text-slate-800">
                  {stockItem.availableQuantity.toLocaleString()}
                </p>
              </div>
            </div>
            {stockItem.quantityByUnit &&
              Object.keys(stockItem.quantityByUnit).length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-slate-500 mb-2">
                    Quantity by Unit
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stockItem.quantityByUnit).map(
                      ([unit, qty]) => (
                        <span
                          key={unit}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm"
                        >
                          {qty.toLocaleString()} {unit}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            <div className="pt-2 border-t">
              <p className="text-xs text-slate-500">Last Updated</p>
              <p className="text-sm text-slate-700">
                {new Date(stockItem.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Ecommerce Limit Card */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Ecommerce Limit
            </h3>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-1">Current Limit</p>
              <p className="text-lg font-bold text-slate-800">
                {formatEcommerceLimit()}
              </p>
            </div>
            {userRole === "owner" && (
              <div className="flex gap-2">
                <button
                  onClick={openEcommerceLimitModal}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" /> Edit Limit
                </button>
                {product.ecommerceMaxPerUser != null && (
                  <button
                    onClick={handleRemoveEcommerceLimit}
                    className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 font-medium transition-colors flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3" /> Remove Limit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* UOM Conversions Card */}
        {product.uomConversions && product.uomConversions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Unit Conversions
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-slate-600">
                    {product.unitOfMeasure || "piece"} (base)
                  </span>
                  <span className="text-sm font-medium text-slate-800">1</span>
                </div>
                {product.uomConversions.map((conv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 border-t"
                  >
                    <span className="text-sm text-slate-600">
                      {conv.unit}
                      {conv.isDefaultSellingUnit && (
                        <span className="ml-1 text-xs text-primary">
                          (default)
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {conv.factor}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions Section */}
      {userRole === "owner" && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openAdjustmentModal("increase")}
              className="px-4 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" /> Increase Stock
            </button>
            <button
              onClick={() => openAdjustmentModal("decrease")}
              disabled={stockItem.quantity === 0}
              className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingDown className="w-4 h-4" /> Decrease Stock
            </button>
            <button
              onClick={handleTransfer}
              disabled={stockItem.quantity === 0}
              className="px-4 py-2 text-sm bg-purple-50 text-primary-600 rounded-lg hover:bg-purple-100 border border-purple-200 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightLeft className="w-4 h-4" /> Transfer to Warehouse
            </button>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustmentModalOpen && (
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
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Product</p>
                <p className="font-bold text-slate-800">
                  {product.productName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {product.productCode} | Current Quantity: {stockItem.quantity}
                </p>
              </div>
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
                      ? stockItem.quantity
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Unit
                </label>
                {(() => {
                  const unitOptions = getAdjustmentUnitOptions();
                  if (unitOptions.length <= 1) {
                    return (
                      <div className="w-full border rounded-lg p-3 bg-slate-50 text-slate-700">
                        {product.unitOfMeasure || "piece"}
                      </div>
                    );
                  }
                  return (
                    <select
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                      value={adjustmentUnit}
                      onChange={(e) => setAdjustmentUnit(e.target.value)}
                    >
                      {unitOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter reason for stock adjustment..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAdjustment}
                  disabled={isAdjusting || adjustmentQuantity <= 0}
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2 ${
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

      {/* Ecommerce Limit Modal */}
      {isEcommerceLimitModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Ecommerce Purchase Limit
              </h2>
              <button
                onClick={() => setIsEcommerceLimitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Product</p>
                <p className="font-bold text-slate-800">
                  {product.productName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {product.productCode} | Current Qty: {stockItem.quantity}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max per user <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  value={ecommerceMaxPerUser || ""}
                  onChange={(e) =>
                    setEcommerceMaxPerUser(Number(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Limit unit{" "}
                  <span className="text-xs text-slate-400">(optional)</span>
                </label>
                {(() => {
                  const unitOptions = getAdjustmentUnitOptions();
                  if (unitOptions.length <= 1) {
                    return (
                      <div className="w-full border rounded-lg p-3 bg-slate-50 text-slate-500 text-sm">
                        No additional units available
                      </div>
                    );
                  }
                  return (
                    <select
                      className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                      value={limitUnit}
                      onChange={(e) => setLimitUnit(e.target.value)}
                    >
                      <option value="">
                        Base unit ({product.unitOfMeasure || "piece"})
                      </option>
                      {unitOptions
                        .filter((opt) => !opt.isBase)
                        .map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                    </select>
                  );
                })()}
                <p className="text-xs text-slate-500 mt-1">
                  Leave as base unit to count directly. Select a unit to
                  multiply by its conversion factor.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reset mode <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="resetMode"
                      checked={resetMode === "manual"}
                      onChange={() => setResetMode("manual")}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-700">Manual</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="resetMode"
                      checked={resetMode === "timeline"}
                      onChange={() => setResetMode("timeline")}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-700">Timeline</span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Manual: admin resets limit. Timeline: auto-resets every N
                  days.
                </p>
              </div>
              {resetMode === "timeline" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reset days <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                    value={resetDays || ""}
                    onChange={(e) => setResetDays(Number(e.target.value) || 0)}
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsEcommerceLimitModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEcommerceLimit}
                  disabled={
                    isSavingEcommerceLimit ||
                    ecommerceMaxPerUser <= 0 ||
                    (resetMode === "timeline" && resetDays < 1)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isSavingEcommerceLimit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" /> Save Limit
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
