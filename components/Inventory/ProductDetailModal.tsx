import React, { useState } from "react";
import {
  Image as ImageIcon,
  X,
  Package,
  DollarSign,
  Store,
  Warehouse,
} from "lucide-react";
import { ProductDetail } from "../../services/Inventory/fetchProductById";
import { useLanguage } from "../../context/LanguageContext";

interface ProductDetailModalProps {
  isOpen: boolean;
  loading: boolean;
  product: ProductDetail | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  loading,
  product,
  onClose,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"about" | "quantity">("about");
  const [stockTab, setStockTab] = useState<"warehouse" | "storefront">(
    "storefront",
  );

  if (!isOpen) return null;

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

  const productImages = product?.images ?? [];
  const primaryImageUrl =
    productImages.find((img) => img.isPrimary)?.url ?? productImages[0]?.url;
  const wholesalePrices = product?.wholesalePrices ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden min-h-0">
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
                ? "bg-[#E8F5E9] text-slate-800 rounded-2xl"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {t("inventory.aboutProduct")}
          </button>
          <button
            onClick={() => setActiveTab("quantity")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "quantity"
                ? "bg-[#E8F5E9] text-slate-800 rounded-2xl"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {t("inventory.productQuantity")}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
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

                  {/* Product Images */}
                  {productImages.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="w-4 h-4 text-slate-500" />
                        <p className="text-xs text-slate-500 font-medium">
                          Product images
                        </p>
                      </div>

                      <div className="space-y-3">
                        {primaryImageUrl && (
                          <img
                            src={primaryImageUrl}
                            alt={product.productName}
                            className="w-64 h-64 object-fit rounded-lg border bg-slate-100"
                          />
                        )}

                        {productImages.length > 1 && primaryImageUrl && (
                          <div className="grid grid-cols-3 gap-2">
                            {productImages
                              .filter((img) => img.url !== primaryImageUrl)
                              .slice(0, 6)
                              .map((img, idx) => (
                                <div
                                  key={
                                    img.key ||
                                    img.id ||
                                    img._id ||
                                    `${img.url}-${idx}`
                                  }
                                  className="rounded-md overflow-hidden border bg-slate-100"
                                >
                                  <img
                                    src={img.url}
                                    alt={product.productName}
                                    className="w-full h-20 object-cover"
                                  />
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
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

                    {wholesalePrices.length > 0 && (
                      <div className="bg-slate-50 p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="w-4 h-4 text-slate-500" />
                          <p className="text-xs text-slate-500 font-medium">
                            Wholesale prices
                          </p>
                        </div>

                        <table className="w-full text-sm border rounded-lg overflow-hidden">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs text-slate-500">
                                Unit
                              </th>
                              <th className="px-3 py-2 text-left text-xs text-slate-500">
                                {t("common.quantity")}
                              </th>
                              <th className="px-3 py-2 text-right text-xs text-slate-500">
                                {t("common.price")} (MMK)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {wholesalePrices.map((wp, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-slate-600">
                                  {wp.unit?.trim() ? wp.unit : "—"}
                                </td>
                                <td className="px-3 py-2">
                                  {wp.quantity.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right font-medium">
                                  {wp.price.toLocaleString()}{" "}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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
                    <div>
                      <p className="text-md font-bold mb-1">SKU</p>
                      <p className="text-md font-mono text-slate-800">
                        {product.SKU}
                      </p>
                    </div>
                    <div>
                      <p className="text-md font-bold mb-1">
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
                      <p className="text-md font-bold mb-1">
                        {t("inventory.brand")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.brand || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-md font-bold mb-1">
                        {t("inventory.unitOfMeasureLabel")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.unitOfMeasure}
                      </p>
                    </div>
                    {product.uomConversions &&
                      product.uomConversions.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 font-medium mb-2">
                            {t("inventory.uomConversions")}
                          </p>
                          <table className="w-full text-sm border rounded-lg overflow-hidden">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs text-slate-500">
                                  {t("inventory.conversionUnit")}
                                </th>
                                <th className="px-3 py-2 text-right text-xs text-slate-500">
                                  {t("inventory.conversionFactor")}
                                </th>
                                <th className="px-3 py-2 text-center text-xs text-slate-500">
                                  {t("inventory.defaultSellingUnitShort")}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {product.uomConversions.map((row, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-2">{row.unit}</td>
                                  <td className="px-3 py-2 text-right">
                                    {row.factor}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {row.isDefaultSellingUnit ? "✓" : ""}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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

                  {/* Note */}
                  {product.note && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-600 font-medium mb-1">
                        {t("pos.note") || "Note"}
                      </p>
                      <p className="text-sm text-slate-800">{product.note}</p>
                    </div>
                  )}

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
                  <div className="bg-[#E8F5E9] p-6 rounded-lg border-2 border-[#E8F5E9]">
                    <div className="flex items-center justify-between">
                      <p className="text-[16px] font-medium text-[#2E7D32]">
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
                          ? "bg-[#E8F5E9] text-slate-800 rounded-2xl"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {t("inventory.warehouses")}
                    </button>
                    <button
                      onClick={() => setStockTab("storefront")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        stockTab === "storefront"
                          ? "bg-[#E8F5E9] text-slate-800 rounded-2xl"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {t("inventory.storefronts")}
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
