import React from "react";
import {
  Store,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Percent,
  Receipt,
} from "lucide-react";
import { SaleReportResponse } from "../../services/Reports/fetchSaleReport";

interface OverallReportTabProps {
  displayReport: {
    finalAmount: number;
    paidAmount: number;
    subTotal: number;
    tax: number;
    discount: number;
    orderCount: number;
    creditOrderCount: number;
    paidOrderCount: number;
    posStats?: {
      totalFinalAmount: number;
      totalPaidAmount: number;
      orderCount: number;
      paidOrderCount: number;
      creditOrderCount: number;
    };
    onlineStats?: {
      totalFinalAmount: number;
      totalPaidAmount: number;
      orderCount: number;
    };
  };
  saleReports: SaleReportResponse[];
  allStorefrontsReport: SaleReportResponse | null;
  selectedStorefront: string;
}

export const OverallReportTab: React.FC<OverallReportTabProps> = ({
  displayReport,
  saleReports,
  allStorefrontsReport,
  selectedStorefront,
}) => {
  // Determine which reports to show in the breakdown table
  const reportsToShow =
    selectedStorefront === "all"
      ? saleReports.filter((report) => report.success)
      : saleReports.filter(
          (report) =>
            report.success && report.data.storefront._id === selectedStorefront,
        );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow border border-primary/20">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <p className="text-[10px] uppercase font-bold tracking-wider">
              Total Sales
            </p>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">
            {displayReport.finalAmount.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-400">MMK</span>
          </p>
          {displayReport.posStats && displayReport.onlineStats && (
            <div className="mt-2 pt-2 border-t flex justify-between text-[10px] font-medium">
              <span className="text-blue-600">
                POS: {displayReport.posStats.totalFinalAmount.toLocaleString()}
              </span>
              <span className="text-indigo-600">
                Online:{" "}
                {displayReport.onlineStats.totalFinalAmount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl shadow border border-green-100">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            <p className="text-[10px] uppercase font-bold tracking-wider">
              Paid Amount
            </p>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-600">
            {displayReport.paidAmount.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-400">MMK</span>
          </p>
          {displayReport.posStats && displayReport.onlineStats && (
            <div className="mt-2 pt-2 border-t flex justify-between text-[10px] font-medium">
              <span className="text-green-700">
                POS: {displayReport.posStats.totalPaidAmount.toLocaleString()}
              </span>
              <span className="text-indigo-600">
                Online:{" "}
                {displayReport.onlineStats.totalPaidAmount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl shadow border border-purple-100">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Percent className="w-3.5 h-3.5" />
            <p className="text-[10px] uppercase font-bold tracking-wider">
              Credit Amount
            </p>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-purple-600">
            {(
              displayReport.finalAmount - displayReport.paidAmount
            ).toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-400">MMK</span>
          </p>
          <p className="mt-2 text-[10px] text-slate-400 font-medium italic">
            * POS credit only
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl shadow border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <p className="text-[10px] uppercase font-bold tracking-wider">
              Total Orders
            </p>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">
            {displayReport.orderCount}
          </p>
          {displayReport.posStats && displayReport.onlineStats && (
            <div className="mt-2 pt-2 border-t flex justify-between text-[10px] font-medium">
              <span className="text-blue-700">
                POS: {displayReport.posStats.orderCount}
              </span>
              <span className="text-indigo-600">
                Online: {displayReport.onlineStats.orderCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold">
              Discount
            </p>
            <p className="text-xl font-bold text-amber-600">
              {displayReport.discount.toLocaleString()}{" "}
              <span className="text-[10px] font-normal">MMK</span>
            </p>
          </div>
          <Percent className="w-8 h-8 text-amber-100" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-red-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold">
              Credit Orders (POS)
            </p>
            <p className="text-xl font-bold text-red-500">
              {displayReport.creditOrderCount}
            </p>
          </div>
          <CreditCard className="w-8 h-8 text-red-100" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-green-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold">
              Paid Orders (POS)
            </p>
            <p className="text-xl font-bold text-green-600">
              {displayReport.paidOrderCount}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-100" />
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs uppercase font-bold">Tax</p>
            <p className="text-xl font-bold text-slate-600">
              {displayReport.tax.toLocaleString()}{" "}
              <span className="text-[10px] font-normal">MMK</span>
            </p>
          </div>
          <Receipt className="w-8 h-8 text-slate-100" />
        </div>
      </div>

      {/* Storefront Breakdown Table */}
      {reportsToShow.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-3 sm:p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {selectedStorefront === "all"
                ? "All Storefronts Breakdown"
                : "Storefront Details"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Storefront
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Final Amount
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Paid Amount
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Sub Total
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Discount
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Total Orders
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Paid Orders
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Credit Orders
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportsToShow.map((report) => (
                  <tr
                    key={report.data.storefront._id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">
                          {report.data.storefront.locationName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {report.data.storefront.locationCode}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {report.data.report.finalAmount.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      {report.data.report.paidAmount.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {report.data.report.subTotal.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600">
                      {report.data.report.discount.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      {report.data.report.orderCount}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      {report.data.report.paidOrderCount}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {report.data.report.creditOrderCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
