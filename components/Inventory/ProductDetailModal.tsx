import React, { useRef, useState } from "react";
import {
  X,
  Package,
  DollarSign,
  TrendingUp,
  Store,
  Warehouse,
  ImageOff,
  Trash2,
  Plus,
  Globe,
} from "lucide-react";
import { ProductDetail } from "../../services/Inventory/fetchProductById";
import { deleteProductImage } from "../../services/Inventory/deleteProductImage";
import { uploadProductImage } from "../../services/Inventory/uploadProductImage";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";

interface ProductDetailModalProps {
  isOpen: boolean;
  loading: boolean;
  product: ProductDetail | null;
  onClose: () => void;
  onImageDeleted?: () => void;
  onImageUploaded?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  loading,
  product,
  onClose,
  onImageDeleted,
  onImageUploaded,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"about" | "quantity">("about");
  const [stockTab, setStockTab] = useState<
    "warehouse" | "storefront" | "online"
  >("storefront");
  const [deletingImage, setDeletingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  if (!isOpen) return null;

  const handleDeleteImage = async (imageKey: string) => {
    if (!product) return;
    setPendingDeleteKey(imageKey);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteImage = async () => {
    if (!product || !pendingDeleteKey) return;
    setShowDeleteConfirm(false);
    setDeletingImage(true);
    try {
      const response = await deleteProductImage(product._id, pendingDeleteKey);
      if (response.success) {
        toast.success("Image deleted successfully");
        onImageDeleted?.();
      } else {
        toast.error(response.message || "Failed to delete image");
      }
    } catch {
      toast.error("Failed to delete image");
    } finally {
      setDeletingImage(false);
      setPendingDeleteKey(null);
    }
  };

  const cancelDeleteImage = () => {
    setShowDeleteConfirm(false);
    setPendingDeleteKey(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    setUploadingImage(true);
    try {
      const response = await uploadProductImage(product._id, file);
      if (response.success) {
        toast.success("Image uploaded successfully");
        onImageUploaded?.();
      } else {
        toast.error(response.message || "Failed to upload image");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {t("inventory.productDetails")}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 py-2 gap-5">
          <button
            onClick={() => setActiveTab("about")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "about"
                ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {t("inventory.aboutProduct")}
          </button>
          <button
            onClick={() => setActiveTab("quantity")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "quantity"
                ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {t("inventory.productQuantity")}
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-2">
                Delete Image?
              </h4>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to delete this image? This action cannot
                be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDeleteImage}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteImage}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto min-h-[calc(60vh)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-500">
                {t("inventory.loadingProductDetails")}
              </p>
            </div>
          ) : product ? (
            <>
              {activeTab === "about" ? (
                <div className="space-y-6">
                  {/* Product Image */}
                  <div className="flex justify-center">
                    {product.images && product.images.length > 0 ? (
                      <div className="relative">
                        <img
                          src={
                            product.images.find((img) => img.isPrimary)?.url ||
                            product.images[0].url
                          }
                          alt={product.productName}
                          className="h-48 w-auto object-contain rounded-lg border border-slate-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                        <button
                          onClick={() =>
                            handleDeleteImage(
                              product.images.find((img) => img.isPrimary)
                                ?.key || product.images[0].key,
                            )
                          }
                          disabled={deletingImage || uploadingImage}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md disabled:opacity-50"
                          title="Delete image"
                        >
                          {deletingImage ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
                          title="Add image"
                        >
                          {uploadingImage ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="h-48 w-48 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                          <ImageOff className="w-10 h-10 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-500">
                            No Image
                          </span>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
                          title="Add image"
                        >
                          {uploadingImage ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Product Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        {t("inventory.productName")}
                      </p>
                      <p className="font-bold text-blue-800">
                        {product.productName}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-xs text-green-600 font-medium mb-1">
                        {t("inventory.productCode")}
                      </p>
                      <p className="font-bold text-green-800">
                        {product.productCode}
                      </p>
                    </div>
                  </div>

                  {/* Sale Code */}
                  {product.saleCode && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-600 font-medium mb-1">
                        Sale Code
                      </p>
                      <p className="font-bold text-purple-800">
                        {product.saleCode}
                      </p>
                    </div>
                  )}

                  {/* Pricing & Profit */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <p className="text-xs text-slate-500 font-medium">
                          {t("inventory.prices")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-slate-600">
                            {t("inventory.buyingPriceLabel")}
                          </span>
                          <span className="text-sm font-medium text-slate-800 ml-2">
                            {product.buyingPrice.toLocaleString()} MMK
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-600">
                            {t("inventory.sellingPriceLabel")}
                          </span>
                          <span className="text-sm font-bold text-slate-800 ml-2">
                            {product.sellingPrice.toLocaleString()} MMK
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-green-600 font-medium">
                          {t("inventory.profit")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-green-600">
                            {t("inventory.profitPercentage")}
                          </span>
                          <span className="text-sm font-medium text-green-800 ml-2">
                            {product.profitMargin}%
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-green-600">
                            {t("inventory.profitAmount")}
                          </span>
                          <span className="text-sm font-bold text-green-800 ml-2">
                            {product.profitAmount.toLocaleString()} MMK
                          </span>
                        </div>
                      </div>
                    </div> */}
                  </div>

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        SKU
                      </p>
                      <p className="text-sm font-mono text-slate-800">
                        {product.SKU}
                      </p>
                    </div> */}
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.category")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.category}
                      </p>
                    </div>
                    {/* <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.subCategoryDetails")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.subCategory || "None"}
                      </p>
                    </div> */}
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.brand")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.brand || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.unitOfMeasureLabel")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.unitOfMeasure}
                      </p>
                    </div>
                    {/* <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.productStatus")}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </div> */}
                  </div>

                  {/* Description */}
                  {/* {product.description && (
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.productDescription")}
                      </p>
                      <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">
                        {product.description}
                      </p>
                    </div>
                  )} */}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.createDate")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {formatDate(product.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.lastUpdatedDate")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {formatDate(product.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Total Quantity Summary */}
                  <div className="bg-[#FEFEB0] p-6 rounded-lg border-2 border-[#FEFEB0]">
                    <div className="flex items-center justify-between">
                      <p className="text-[16px] font-medium text-[#585800]">
                        {t("inventory.productTotalQuantity")}
                      </p>
                      <p className="text-4xl font-bold text-slate-800">
                        {product.stockAvailability.totalQuantity.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Stock Tabs */}
                  <div className="flex gap-5">
                    <button
                      onClick={() => setStockTab("warehouse")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        stockTab === "warehouse"
                          ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {t("inventory.warehouses")}
                    </button>
                    <button
                      onClick={() => setStockTab("storefront")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        stockTab === "storefront"
                          ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {t("inventory.storefronts")}
                    </button>
                    <button
                      onClick={() => setStockTab("online")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        stockTab === "online"
                          ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Online
                    </button>
                  </div>

                  {/* Warehouse Summary Cards */}
                  {stockTab === "warehouse" &&
                    product.stockAvailability.warehouses.count > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              {t("inventory.warehouses")}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.warehouses.count}{" "}
                              {t("inventory.warehouses")}
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              {t("inventory.totalQtyInWarehouses")}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.warehouses.totalQuantity.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Warehouse Location Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          {product.stockAvailability.warehouses.locations.map(
                            (location) => (
                              <div
                                key={location.locationId}
                                className="bg-slate-100 p-4 rounded-lg border border-slate-300"
                              >
                                <h4 className="font-semibold text-slate-800 mb-1">
                                  {location.locationName}
                                </h4>
                                <p className="text-xs text-slate-600 mb-3">
                                  {location.locationAddress || "-"}
                                </p>
                                <div className="flex justify-end">
                                  <span className="text-sm font-bold text-slate-800">
                                    Quantity{" "}
                                    {location.quantity.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </>
                    )}

                  {/* Storefront Summary Cards */}
                  {stockTab === "storefront" &&
                    product.stockAvailability.storefronts.count > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              {t("inventory.storefronts")}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.storefronts.count}{" "}
                              {t("inventory.storefronts")}
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              Total QTY In Storefronts
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.storefronts.totalQuantity.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Storefront Location Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          {product.stockAvailability.storefronts.locations.map(
                            (location) => (
                              <div
                                key={location.locationId}
                                className="bg-slate-100 p-4 rounded-lg border border-slate-300"
                              >
                                <h4 className="font-semibold text-slate-800 mb-1">
                                  {location.locationName}
                                </h4>
                                <p className="text-xs text-slate-600 mb-3">
                                  {location.locationAddress || "-"}
                                </p>
                                <div className="flex justify-end">
                                  <span className="text-sm font-bold text-slate-800">
                                    Quantity{" "}
                                    {location.quantity.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </>
                    )}

                  {/* Online Storefront Summary Cards */}
                  {stockTab === "online" &&
                    product.stockAvailability.online.count > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              Online Storefront
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              Available Online
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              Total Online QTY
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.online.totalQuantity.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Online Location Cards */}
                        <div className="grid grid-cols-1 gap-4">
                          {product.stockAvailability.online.locations.map(
                            (location) => (
                              <div
                                key={location.locationId}
                                className="bg-slate-100 p-4 rounded-lg border border-slate-300"
                              >
                                <h4 className="font-semibold text-slate-800 mb-1">
                                  {location.locationName}
                                </h4>
                                <div className="flex justify-between items-center">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      location.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {location.status}
                                  </span>
                                  <span className="text-sm font-bold text-slate-800">
                                    Quantity{" "}
                                    {location.quantity.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </>
                    )}

                  {/* Empty States */}
                  {stockTab === "warehouse" &&
                    product.stockAvailability.warehouses.count === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Warehouse className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>No warehouses found</p>
                      </div>
                    )}

                  {stockTab === "storefront" &&
                    product.stockAvailability.storefronts.count === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Store className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>No storefronts found</p>
                      </div>
                    )}

                  {stockTab === "online" &&
                    product.stockAvailability.online.count === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Globe className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>Not added to online storefront</p>
                      </div>
                    )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500">
                {t("inventory.noProductDetails")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
