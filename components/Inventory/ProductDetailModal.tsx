import React from "react";
import {
  X,
  Package,
  DollarSign,
  TrendingUp,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Product Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-500">Loading product details...</p>
            </div>
          ) : product ? (
            <div className="space-y-6">
              {/* Product Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    Product Name
                  </p>
                  <p className="font-bold text-blue-800">
                    {product.productName}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    Product Code
                  </p>
                  <p className="font-bold text-green-800">
                    {product.productCode}
                  </p>
                </div>
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">SKU</p>
                  <p className="text-sm font-mono text-slate-800">
                    {product.SKU}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Category
                  </p>
                  <p className="text-sm text-slate-800">{product.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Sub Category
                  </p>
                  <p className="text-sm text-slate-800">
                    {product.subCategory || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Brand
                  </p>
                  <p className="text-sm text-slate-800">
                    {product.brand || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Unit of Measure
                  </p>
                  <p className="text-sm text-slate-800">
                    {product.unitOfMeasure}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Status
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
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Description
                  </p>
                  <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Pricing & Profit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <p className="text-xs text-slate-500 font-medium">
                      Pricing
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">
                        Buying Price:
                      </span>
                      <span className="text-sm font-medium text-slate-800">
                        {product.buyingPrice.toLocaleString()} MMK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">
                        Selling Price:
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {product.sellingPrice.toLocaleString()} MMK
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-green-600 font-medium">Profit</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-green-600">
                        Profit Margin:
                      </span>
                      <span className="text-sm font-medium text-green-800">
                        {product.profitMargin}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-green-600">
                        Profit Amount:
                      </span>
                      <span className="text-sm font-bold text-green-800">
                        {product.profitAmount.toLocaleString()} MMK
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Availability */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-slate-700">
                    Stock Availability
                  </h4>
                </div>

                {/* Total Stock Summary */}
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">
                      Total Quantity
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {product.stockAvailability.totalQuantity.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Warehouses */}
                {product.stockAvailability.warehouses.count > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Warehouse className="w-4 h-4 text-blue-600" />
                      <h5 className="font-medium text-slate-700">
                        Warehouses ({product.stockAvailability.warehouses.count}
                        )
                      </h5>
                      <span className="text-sm text-slate-500">
                        Total:{" "}
                        {product.stockAvailability.warehouses.totalQuantity}
                      </span>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                              Location
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                              Code
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                              Address
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-600">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                              Last Updated
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {product.stockAvailability.warehouses.locations.map(
                            (location) => (
                              <tr
                                key={location.locationId}
                                className="hover:bg-slate-50"
                              >
                                <td className="px-3 py-2 font-medium text-slate-800">
                                  {location.locationName}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                    {location.locationCode}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-500 text-xs">
                                  {location.locationAddress || "-"}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-blue-600">
                                  {location.quantity.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-slate-500 text-xs">
                                  {formatDate(location.lastUpdated)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Storefronts */}
                {product.stockAvailability.storefronts.count > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-green-600" />
                      <h5 className="font-medium text-slate-700">
                        Storefronts (
                        {product.stockAvailability.storefronts.count})
                      </h5>
                      <span className="text-sm text-slate-500">
                        Total:{" "}
                        {product.stockAvailability.storefronts.totalQuantity}
                      </span>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                              Location
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                              Code
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                              Address
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-600">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                              Last Updated
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {product.stockAvailability.storefronts.locations.map(
                            (location) => (
                              <tr
                                key={location.locationId}
                                className="hover:bg-slate-50"
                              >
                                <td className="px-3 py-2 font-medium text-slate-800">
                                  {location.locationName}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                    {location.locationCode}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-500 text-xs">
                                  {location.locationAddress || "-"}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-green-600">
                                  {location.quantity.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-slate-500 text-xs">
                                  {formatDate(location.lastUpdated)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {/* <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Reorder Point
                  </p>
                  <p className="text-sm text-slate-800">
                    {product.reorderPoint || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Reorder Quantity
                  </p>
                  <p className="text-sm text-slate-800">
                    {product.reorderQuantity || 0}
                  </p>
                </div> */}
                {/* <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Tax Rate
                  </p>
                  <p className="text-sm text-slate-800">
                    {product.taxRate || 0}%
                  </p>
                </div> */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Created At
                  </p>
                  <p className="text-sm text-slate-800">
                    {formatDate(product.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Updated At
                  </p>
                  <p className="text-sm text-slate-800">
                    {formatDate(product.updatedAt)}
                  </p>
                </div>
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-primary/20 text-primary-700 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500">No product details available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
