import React from "react";
import {
  Loader2,
  TrendingUp,
  Package,
  DollarSign,
  CreditCard,
  Wallet,
} from "lucide-react";
import { StorefrontStockItem } from "../../services/Storefront/fetchStorefrontStock";
import { CreditOrdersReportResponse } from "../../services/Reports/fetchCreditOrdersReport";
import { PaidOrdersReportResponse } from "../../services/Reports/fetchPaidOrdersReport";

interface TotalRevenueTabProps {
  storefrontStock: StorefrontStockItem[];
  allStorefrontsStock: StorefrontStockItem[];
  selectedStorefront: string;
  loading: boolean;
  creditOrdersReport: CreditOrdersReportResponse | null;
  allStorefrontsCreditOrdersReport: CreditOrdersReportResponse | null;
  paidOrdersReport: PaidOrdersReportResponse | null;
  allStorefrontsPaidOrdersReport: PaidOrdersReportResponse | null;
}

export const TotalRevenueTab: React.FC<TotalRevenueTabProps> = ({
  storefrontStock,
  allStorefrontsStock,
  selectedStorefront,
  loading,
  creditOrdersReport,
  allStorefrontsCreditOrdersReport,
  paidOrdersReport,
  allStorefrontsPaidOrdersReport,
}) => {
  // Calculate total inventory amount
  const calculateInventoryAmount = (stock: StorefrontStockItem[]) => {
    return stock.reduce((total, item) => {
      const price = item.inventoryId.sellingPrice || 0;
      const quantity = item.availableQuantity || 0;
      return total + price * quantity;
    }, 0);
  };

  // Get the appropriate stock data based on selection
  const currentStock =
    selectedStorefront === "all" ? allStorefrontsStock : storefrontStock;

  // Get the appropriate credit orders data based on selection
  const currentCreditOrders =
    selectedStorefront === "all"
      ? allStorefrontsCreditOrdersReport
      : creditOrdersReport;

  // Get the appropriate paid orders data based on selection
  const currentPaidOrders =
    selectedStorefront === "all"
      ? allStorefrontsPaidOrdersReport
      : paidOrdersReport;

  // Check if all required data is loaded
  const isDataFullyLoaded = () => {
    const hasStockData = currentStock.length > 0;
    const hasCreditOrdersData = currentCreditOrders?.success === true;
    const hasPaidOrdersData = currentPaidOrders?.success === true;

    return hasStockData && hasCreditOrdersData && hasPaidOrdersData;
  };

  // Show loading state if base loading is true or if data is not fully loaded
  const shouldShowLoading = loading || !isDataFullyLoaded();

  // Calculate total inventory amount
  const totalInventoryAmount = calculateInventoryAmount(currentStock);

  // Get credit orders data
  const totalCreditPaidAmount = currentCreditOrders?.success
    ? currentCreditOrders.data.totals.totalPaidAmount
    : 0;
  const totalCreditRemainingAmount = currentCreditOrders?.success
    ? currentCreditOrders.data.totals.totalRemainingBalance
    : 0;

  // Get paid orders data
  const totalPaidOrderAmount = currentPaidOrders?.success
    ? currentPaidOrders.data.totals.totalPaidAmount
    : 0;

  // Calculate total revenue
  const totalRevenue =
    totalInventoryAmount +
    totalCreditPaidAmount +
    totalCreditRemainingAmount +
    totalPaidOrderAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MMK",
    }).format(amount);
  };

  if (shouldShowLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-600">Loading revenue data...</p>
        <p className="text-sm text-slate-500 mt-2">
          Fetching inventory, credit orders, and paid orders data
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Revenue Overview */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-800">
            Total Revenue Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Inventory Amount */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Total Inventory Value
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(totalInventoryAmount)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {currentStock.length} products
            </p>
          </div>

          {/* Total Credit Paid Amount */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Credit Paid Amount
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(totalCreditPaidAmount)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Amount collected from credit orders
            </p>
          </div>

          {/* Total Credit Remaining Amount */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Credit Remaining
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {formatCurrency(totalCreditRemainingAmount)}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Outstanding credit amount
            </p>
          </div>

          {/* Total Paid Order Amount */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                Paid Order Amount
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(totalPaidOrderAmount)}
            </p>
            <p className="text-xs text-purple-600 mt-1">Direct paid orders</p>
          </div>
        </div>

        {/* Total Revenue Summary */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Total Revenue
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Sum of all revenue components for{" "}
                {selectedStorefront === "all"
                  ? "all storefronts"
                  : "selected storefront"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-800">
            Inventory Value Breakdown
          </h2>
        </div>

        {currentStock.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No inventory data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                    Unit Price
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                    Quantity
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentStock.map((item) => {
                  const unitPrice = item.inventoryId.sellingPrice || 0;
                  const quantity = item.availableQuantity || 0;
                  const totalValue = unitPrice * quantity;

                  return (
                    <tr
                      key={item._id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-800">
                            {item.inventoryId.productName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {item.inventoryId.productCode}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {item.inventoryId.SKU}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {item.inventoryId.category}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-slate-800">
                        {formatCurrency(unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-slate-600">
                        {quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-800">
                        {formatCurrency(totalValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
