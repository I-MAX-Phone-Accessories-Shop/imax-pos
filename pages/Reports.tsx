import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../services/Location/fetchLocationProfiles";
import {
  fetchSaleReport,
  SaleReportResponse,
} from "../services/Reports/fetchSaleReport";
import { Loader2, RefreshCw, Store } from "lucide-react";
import { toast } from "sonner";

export const Reports: React.FC = () => {
  const { sales, products, expenses } = useApp();

  const [storefronts, setStorefronts] = useState<LocationProfile[]>([]);
  const [saleReports, setSaleReports] = useState<SaleReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStorefront, setSelectedStorefront] = useState<string>("all");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Fetch all storefronts
      const locationResponse = await fetchLocationProfiles();
      if (locationResponse.success) {
        const storefrontList = locationResponse.data.filter(
          (loc) => loc.type === "storefront" && loc.status === "active"
        );
        setStorefronts(storefrontList);

        // Fetch sale reports for each storefront
        const reports = await Promise.all(
          storefrontList.map((storefront) => fetchSaleReport(storefront._id))
        );
        setSaleReports(reports);
      } else {
        toast.error("Failed to load storefronts");
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  // Aggregate data from all storefronts
  const aggregatedReport = saleReports.reduce(
    (acc, report) => {
      if (report.success) {
        acc.finalAmount += report.data.report.finalAmount;
        acc.paidAmount += report.data.report.paidAmount;
        acc.subTotal += report.data.report.subTotal;
        acc.tax += report.data.report.tax;
        acc.discount += report.data.report.discount;
        acc.extraChange += report.data.report.extraChange;
        acc.orderCount += report.data.report.orderCount;
        acc.creditOrderCount += report.data.report.creditOrderCount;
        acc.paidOrderCount += report.data.report.paidOrderCount;
      }
      return acc;
    },
    {
      finalAmount: 0,
      paidAmount: 0,
      subTotal: 0,
      tax: 0,
      discount: 0,
      extraChange: 0,
      orderCount: 0,
      creditOrderCount: 0,
      paidOrderCount: 0,
    }
  );

  // Filter reports based on selected storefront
  const filteredReports =
    selectedStorefront === "all"
      ? saleReports
      : saleReports.filter(
          (report) => report.data.storefront._id === selectedStorefront
        );

  const displayReport =
    selectedStorefront === "all"
      ? aggregatedReport
      : filteredReports[0]?.data.report || aggregatedReport;

  // Data for storefront comparison chart
  const storefrontData = saleReports
    .filter((report) => report.success)
    .map((report) => ({
      name: report.data.storefront.locationCode,
      amount: report.data.report.finalAmount,
      orders: report.data.report.orderCount,
    }));

  // Data for order type pie chart
  const orderTypeData = [
    {
      name: "Paid Orders",
      value: displayReport.paidOrderCount,
    },
    {
      name: "Credit Orders",
      value: displayReport.creditOrderCount,
    },
  ];

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedStorefront}
            onChange={(e) => setSelectedStorefront(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="all">All Storefronts</option>
            {storefronts.map((sf) => (
              <option key={sf._id} value={sf._id}>
                {sf.locationName} ({sf.locationCode})
              </option>
            ))}
          </select>
          <button
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-primary/20">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Final Amount
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {displayReport.finalAmount.toLocaleString()} MMK
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-green-100">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Paid Amount
          </p>
          <p className="text-2xl font-bold text-green-600">
            {displayReport.paidAmount.toLocaleString()} MMK
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-blue-100">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Total Orders
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {displayReport.orderCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-purple-100">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Sub Total
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {displayReport.subTotal.toLocaleString()} MMK
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-amber-100">
          <p className="text-slate-500 text-xs uppercase font-bold">Discount</p>
          <p className="text-2xl font-bold text-amber-600">
            {displayReport.discount.toLocaleString()} MMK
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-red-100">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Credit Orders
          </p>
          <p className="text-2xl font-bold text-red-500">
            {displayReport.creditOrderCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-green-100">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Paid Orders
          </p>
          <p className="text-2xl font-bold text-green-600">
            {displayReport.paidOrderCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-slate-100">
          <p className="text-slate-500 text-xs uppercase font-bold">Tax</p>
          <p className="text-2xl font-bold text-slate-600">
            {displayReport.tax.toLocaleString()} MMK
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white h-full p-6 rounded-xl shadow-sm border">
          <h3 className="font-bold text-slate-700 mb-4">Order Types</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={orderTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {orderTypeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              {/* <Legend /> */}
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border h-80">
          <h3 className="font-bold text-slate-700 mb-4">
            {selectedStorefront === "all"
              ? "Sales by Storefront"
              : "Storefront Performance"}
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={storefrontData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} MMK`}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Storefront Breakdown Table */}
      {selectedStorefront === "all" && storefronts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Storefront Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
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
                {saleReports
                  .filter((report) => report.success)
                  .map((report) => (
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
