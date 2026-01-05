import React from "react";
import { Loader2, Package, TrendingUp, ShoppingCart } from "lucide-react";
import { ProductSalesStatisticsResponse } from "../../services/Reports/fetchProductSalesStatistics";

interface SaleStatisticsTabProps {
  productSalesStatistics: ProductSalesStatisticsResponse | null;
  loading: boolean;
}

export const SaleStatisticsTab: React.FC<SaleStatisticsTabProps> = ({
  productSalesStatistics,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-600">Loading product sales statistics...</p>
      </div>
    );
  }

  if (!productSalesStatistics?.success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No product sales data available</p>
      </div>
    );
  }

  const { data } = productSalesStatistics;
  const { totals, products } = data;

  console.log(data);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold">
                Total Quantity Sold
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {totals.totalQuantity.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-green-600">
                {totals.totalRevenue.toLocaleString()} MMK
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold">
                Unique Products
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {totals.totalUniqueProducts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Product Sales Breakdown ({products.length})
          </h3>
        </div>
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No products found in this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Product
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Category
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Quantity Sold
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Total Revenue
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Avg. Unit Price
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Min Price
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Max Price
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.inventoryId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">
                          {product.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.productCode} • {product.SKU}
                        </p>
                        {product.brand && (
                          <p className="text-xs text-slate-400 mt-1">
                            Brand: {product.brand}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                        {product.category}
                      </span>
                      {product.subCategory &&
                        product.subCategory !== "Unknown" && (
                          <span className="ml-2 text-xs text-slate-500">
                            / {product.subCategory}
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">
                      {product.totalQuantity.toLocaleString()}{" "}
                      {product.unitOfMeasure}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {product.totalRevenue.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {product.averageUnitPrice.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 text-xs">
                      {product.minUnitPrice.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 text-xs">
                      {product.maxUnitPrice.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {product.orderCount}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2">
                <tr>
                  <td
                    className="px-4 py-3 font-bold text-slate-800"
                    colSpan={2}
                  >
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600 text-lg">
                    {totals.totalQuantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-600 text-lg">
                    {totals.totalRevenue.toLocaleString()} MMK
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
