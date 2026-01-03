import React, { useState, useEffect } from "react";
import { Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../services/Location/fetchLocationProfiles";
import {
  fetchSaleReport,
  SaleReportResponse,
} from "../services/Reports/fetchSaleReport";
import {
  fetchPaidOrdersReport,
  PaidOrdersReportResponse,
} from "../services/Reports/fetchPaidOrdersReport";
import {
  fetchCreditOrdersReport,
  CreditOrdersReportResponse,
} from "../services/Reports/fetchCreditOrdersReport";
import { ReportsHeader } from "../components/Reports/ReportsHeader";
import { ReportTabs } from "../components/Reports/ReportTabs";
import { OverallReportTab } from "../components/Reports/OverallReportTab";
import { PaidOrdersTab } from "../components/Reports/PaidOrdersTab";
import { CreditOrdersTab } from "../components/Reports/CreditOrdersTab";

type TabType = "overall" | "paid" | "credit";

export const Reports: React.FC = () => {
  const [storefronts, setStorefronts] = useState<LocationProfile[]>([]);
  const [saleReports, setSaleReports] = useState<SaleReportResponse[]>([]);
  const [paidOrdersReport, setPaidOrdersReport] =
    useState<PaidOrdersReportResponse | null>(null);
  const [creditOrdersReport, setCreditOrdersReport] =
    useState<CreditOrdersReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPaidOrders, setLoadingPaidOrders] = useState(false);
  const [loadingCreditOrders, setLoadingCreditOrders] = useState(false);
  const [selectedStorefront, setSelectedStorefront] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<TabType>("overall");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (selectedStorefront !== "all") {
      if (activeTab === "paid") {
        loadPaidOrdersReport();
      } else if (activeTab === "credit") {
        loadCreditOrdersReport();
      } else if (activeTab === "overall") {
        loadReports();
      }
    } else {
      setPaidOrdersReport(null);
      setCreditOrdersReport(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStorefront, activeTab, startDate, endDate]);

  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const locationResponse = await fetchLocationProfiles();
      if (locationResponse.success) {
        const storefrontList = locationResponse.data.filter(
          (loc) => loc.type === "storefront" && loc.status === "active"
        );
        setStorefronts(storefrontList);

        const startDateStr = formatDateForAPI(startDate);
        const endDateStr = formatDateForAPI(endDate);

        const reports = await Promise.all(
          storefrontList.map((storefront) =>
            fetchSaleReport(storefront._id, startDateStr, endDateStr)
          )
        );
        setSaleReports(reports);

        if (storefrontList.length > 0 && selectedStorefront === "all") {
          setSelectedStorefront(storefrontList[0]._id);
        }
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

  const loadPaidOrdersReport = async () => {
    if (selectedStorefront === "all") return;

    setLoadingPaidOrders(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchPaidOrdersReport(
        selectedStorefront,
        startDateStr,
        endDateStr
      );
      setPaidOrdersReport(response);
    } catch (error) {
      console.error("Error loading paid orders report:", error);
      toast.error("Failed to load paid orders report");
    } finally {
      setLoadingPaidOrders(false);
    }
  };

  const loadCreditOrdersReport = async () => {
    if (selectedStorefront === "all") return;

    setLoadingCreditOrders(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchCreditOrdersReport(
        selectedStorefront,
        startDateStr,
        endDateStr
      );
      setCreditOrdersReport(response);
    } catch (error) {
      console.error("Error loading credit orders report:", error);
      toast.error("Failed to load credit orders report");
    } finally {
      setLoadingCreditOrders(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (selectedStorefront !== "all") {
      if (tab === "paid" && !paidOrdersReport) {
        loadPaidOrdersReport();
      } else if (tab === "credit" && !creditOrdersReport) {
        loadCreditOrdersReport();
      }
    }
  };

  const handleRefresh = () => {
    loadReports();
    if (activeTab === "paid" && selectedStorefront !== "all") {
      loadPaidOrdersReport();
    } else if (activeTab === "credit" && selectedStorefront !== "all") {
      loadCreditOrdersReport();
    }
  };

  const handleDateRangeChange = (
    newStartDate: Date | null,
    newEndDate: Date | null
  ) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
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
      <ReportsHeader
        storefronts={storefronts}
        selectedStorefront={selectedStorefront}
        onStorefrontChange={setSelectedStorefront}
        onRefresh={handleRefresh}
        loading={loading}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
      />

      <ReportTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Overall Tab */}
      {activeTab === "overall" && (
        <OverallReportTab
          displayReport={displayReport}
          saleReports={saleReports}
        />
      )}

      {/* Paid Orders Tab */}
      {activeTab === "paid" && selectedStorefront !== "all" && (
        <PaidOrdersTab
          paidOrdersReport={paidOrdersReport}
          loading={loadingPaidOrders}
        />
      )}

      {/* Credit Orders Tab */}
      {activeTab === "credit" && selectedStorefront !== "all" && (
        <CreditOrdersTab
          creditOrdersReport={creditOrdersReport}
          loading={loadingCreditOrders}
        />
      )}

      {/* Show message if no storefront selected for paid/credit tabs */}
      {(activeTab === "paid" || activeTab === "credit") &&
        selectedStorefront === "all" && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Store className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              Please select a storefront to view {activeTab} orders report
            </p>
          </div>
        )}
    </div>
  );
};
