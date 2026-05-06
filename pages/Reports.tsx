import React, { useState, useEffect } from "react";
import { Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../services/Location/fetchLocationProfiles";
import {
  fetchSaleReport,
  fetchAllStorefrontsSaleReport,
  SaleReportResponse,
} from "../services/Reports/fetchSaleReport";
import {
  fetchPaidOrdersReport,
  fetchAllStorefrontsPaidOrdersReport,
  PaidOrdersReportResponse,
} from "../services/Reports/fetchPaidOrdersReport";
import {
  fetchCreditOrdersReport,
  fetchAllStorefrontsCreditOrdersReport,
  CreditOrdersReportResponse,
} from "../services/Reports/fetchCreditOrdersReport";
import {
  fetchCreditRecords,
  CreditRecord,
} from "../services/Reports/fetchCreditRecords";
import {
  fetchProductSalesStatistics,
  fetchAllStorefrontsProductSalesStatistics,
  ProductSalesStatisticsResponse,
} from "../services/Reports/fetchProductSalesStatistics";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import {
  fetchFOCOrders,
  fetchAllStorefrontsFOCOrders,
  FOCOrder,
} from "../services/Reports/fetchFOCOrders";
import { fetchOnlineStorefront } from "../services/OnlineStorefront/fetchOnlineStorefront";
import {
  fetchOnlineStorefrontInventory,
  OnlineStorefrontStockItem,
} from "../services/OnlineStorefront/fetchOnlineStorefrontInventory";
import { ReportsHeader } from "../components/Reports/ReportsHeader";
import { ReportTabs } from "../components/Reports/ReportTabs";
import { OverallReportTab } from "../components/Reports/OverallReportTab";
import { PaidOrdersTab } from "../components/Reports/PaidOrdersTab";
import { CreditOrdersTab } from "../components/Reports/CreditOrdersTab";
import { SaleStatisticsTab } from "../components/Reports/SaleStatisticsTab";
import { TotalRevenueTab } from "../components/Reports/TotalRevenueTab";
import { FOCTab } from "../components/Reports/FOCTab";

type TabType = "overall" | "paid" | "credit" | "statistics" | "revenue" | "foc";

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const Reports: React.FC = () => {
  const [storefronts, setStorefronts] = useState<LocationProfile[]>([]);
  const [saleReports, setSaleReports] = useState<SaleReportResponse[]>([]);
  const [allStorefrontsReport, setAllStorefrontsReport] =
    useState<SaleReportResponse | null>(null);
  const [paidOrdersReport, setPaidOrdersReport] =
    useState<PaidOrdersReportResponse | null>(null);
  const [allStorefrontsPaidOrdersReport, setAllStorefrontsPaidOrdersReport] =
    useState<PaidOrdersReportResponse | null>(null);
  const [creditOrdersReport, setCreditOrdersReport] =
    useState<CreditOrdersReportResponse | null>(null);
  const [
    allStorefrontsCreditOrdersReport,
    setAllStorefrontsCreditOrdersReport,
  ] = useState<CreditOrdersReportResponse | null>(null);
  const [creditRecordsData, setCreditRecordsData] = useState<CreditRecord[]>([]);
  const [cumulativeCreditRecordsData, setCumulativeCreditRecordsData] =
    useState<CreditRecord[]>([]);
  const [productSalesStatistics, setProductSalesStatistics] =
    useState<ProductSalesStatisticsResponse | null>(null);
  const [
    allStorefrontsProductSalesStatistics,
    setAllStorefrontsProductSalesStatistics,
  ] = useState<ProductSalesStatisticsResponse | null>(null);
  const [storefrontStock, setStorefrontStock] = useState<StorefrontStockItem[]>([]);
  const [allStorefrontsStock, setAllStorefrontsStock] = useState<StorefrontStockItem[]>([]);
  const [onlineInventory, setOnlineInventory] = useState<OnlineStorefrontStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPaidOrders, setLoadingPaidOrders] = useState(false);
  const [loadingCreditOrders, setLoadingCreditOrders] = useState(false);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingFOC, setLoadingFOC] = useState(false);
  const [selectedStorefront, setSelectedStorefront] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<TabType>("revenue");
  
  const [startDate, setStartDate] = useState<Date | null>(getToday());
  const [endDate, setEndDate] = useState<Date | null>(getToday());
  const [focOrders, setFocOrders] = useState<FOCOrder[]>([]);
  const [allStorefrontsFocOrders, setAllStorefrontsFocOrders] = useState<FOCOrder[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (selectedStorefront !== "all") {
      if (activeTab === "paid") {
        loadPaidOrdersReport();
      } else if (activeTab === "credit") {
        loadCreditOrdersReport();
      } else if (activeTab === "statistics") {
        loadProductSalesStatistics();
      } else if (activeTab === "revenue") {
        loadRevenueData();
      } else if (activeTab === "foc") {
        loadFOCOrders();
      } else if (activeTab === "overall") {
        loadReports();
      }
    } else {
      if (activeTab === "paid") {
        loadAllStorefrontsPaidOrdersReport();
      } else if (activeTab === "credit") {
        loadAllStorefrontsCreditOrdersReport();
      } else if (activeTab === "statistics") {
        loadAllStorefrontsProductSalesStatistics();
      } else if (activeTab === "revenue") {
        loadRevenueData();
      } else if (activeTab === "foc") {
        loadAllStorefrontsFOCOrders();
      } else if (activeTab === "overall") {
        loadReports();
      }
    }
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
      const [locationResponse, onlineResponse] = await Promise.all([
        fetchLocationProfiles(),
        fetchOnlineStorefront(),
      ]);

      if (locationResponse.success) {
        let storefrontList = locationResponse.data.filter(
          (loc) => loc.type === "storefront" && loc.status === "active",
        );

        if (onlineResponse.success && onlineResponse.data && onlineResponse.data.status === "active") {
          const onlineLoc: LocationProfile = {
            _id: onlineResponse.data._id,
            type: "online",
            locationCode: "ONLINE",
            locationName: onlineResponse.data.name,
            locationAddress: "Digital Storefront",
            locationPhone: onlineResponse.data.contactPhone || "N/A",
            status: "active",
          };
          storefrontList = [onlineLoc, ...storefrontList];
        }

        setStorefronts(storefrontList);

        const startDateStr = formatDateForAPI(startDate);
        const endDateStr = formatDateForAPI(endDate);

        const allReportResponse = await fetchAllStorefrontsSaleReport(startDateStr, endDateStr);
        setAllStorefrontsReport(allReportResponse);

        const reports = await Promise.all(
          storefrontList.map((storefront) =>
            fetchSaleReport(storefront._id, startDateStr, endDateStr),
          ),
        );
        setSaleReports(reports);

        if (storefrontList.length > 0 && (selectedStorefront === "all" || !storefrontList.find((s) => s._id === selectedStorefront))) {
          setSelectedStorefront("all");
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
      const response = await fetchPaidOrdersReport(selectedStorefront, startDateStr, endDateStr);
      setPaidOrdersReport(response);
    } catch (error) {
      console.error("Error loading paid orders report:", error);
      toast.error("Failed to load paid orders report");
    } finally {
      setLoadingPaidOrders(false);
    }
  };

  const loadAllStorefrontsPaidOrdersReport = async () => {
    setLoadingPaidOrders(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchAllStorefrontsPaidOrdersReport(startDateStr, endDateStr);
      setAllStorefrontsPaidOrdersReport(response);
    } catch (error) {
      console.error("Error loading all storefronts paid orders report:", error);
      toast.error("Failed to load all storefronts paid orders report");
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
      const response = await fetchCreditOrdersReport(selectedStorefront, startDateStr, endDateStr);
      setCreditOrdersReport(response);
    } catch (error) {
      console.error("Error loading credit orders report:", error);
      toast.error("Failed to load credit orders report");
    } finally {
      setLoadingCreditOrders(false);
    }
  };

  const loadAllStorefrontsCreditOrdersReport = async () => {
    setLoadingCreditOrders(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchAllStorefrontsCreditOrdersReport(startDateStr, endDateStr);
      setAllStorefrontsCreditOrdersReport(response);
    } catch (error) {
      console.error("Error loading all storefronts credit orders report:", error);
      toast.error("Failed to load all storefronts credit orders report");
    } finally {
      setLoadingCreditOrders(false);
    }
  };

  const loadProductSalesStatistics = async () => {
    if (selectedStorefront === "all") return;
    setLoadingStatistics(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchProductSalesStatistics(selectedStorefront, startDateStr, endDateStr);
      setProductSalesStatistics(response);
    } catch (error) {
      console.error("Error loading product sales statistics:", error);
      toast.error("Failed to load product sales statistics");
    } finally {
      setLoadingStatistics(false);
    }
  };

  const loadAllStorefrontsProductSalesStatistics = async () => {
    setLoadingStatistics(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchAllStorefrontsProductSalesStatistics(startDateStr, endDateStr);
      setAllStorefrontsProductSalesStatistics(response);
    } catch (error) {
      console.error("Error loading all storefronts product sales statistics:", error);
      toast.error("Failed to load all storefronts product sales statistics");
    } finally {
      setLoadingStatistics(false);
    }
  };

  const loadStorefrontStock = async () => {
    if (selectedStorefront === "all") return;
    setLoadingRevenue(true);
    try {
      const response = await fetchStorefrontStock(selectedStorefront);
      if (response.success) {
        setStorefrontStock(response.data);
      } else {
        toast.error("Failed to load storefront inventory");
      }
    } catch (error) {
      console.error("Error loading storefront stock:", error);
      toast.error("Failed to load storefront inventory");
    } finally {
      setLoadingRevenue(false);
    }
  };

  const loadAllStorefrontsStock = async () => {
    setLoadingRevenue(true);
    try {
      setAllStorefrontsStock([]);
    } catch (error) {
      console.error("Error loading all storefronts stock:", error);
      toast.error("Failed to load all storefronts stock");
    } finally {
      setLoadingRevenue(false);
    }
  };

  const loadFOCOrders = async () => {
    if (selectedStorefront === "all") return;
    setLoadingFOC(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchFOCOrders(selectedStorefront, startDateStr!, endDateStr!);
      setFocOrders(response);
    } catch (error) {
      console.error("Error loading FOC orders:", error);
      toast.error("Failed to load FOC orders");
    } finally {
      setLoadingFOC(false);
    }
  };

  const loadAllStorefrontsFOCOrders = async () => {
    setLoadingFOC(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchAllStorefrontsFOCOrders(startDateStr!, endDateStr!);
      setAllStorefrontsFocOrders(response);
    } catch (error) {
      console.error("Error loading all storefronts FOC orders:", error);
      toast.error("Failed to load all storefronts FOC orders");
    } finally {
      setLoadingFOC(false);
    }
  };

  const loadRevenueData = async () => {
    setLoadingRevenue(true);
    try {
      const chosenDateStr = formatDateForAPI(endDate);
      const fixedStartStr = "2025-12-01";

      if (selectedStorefront === "all") {
        const [
          stockResponse,
          onlineStockResponse,
          creditResponse,
          paidResponse,
          creditRecordsResponse,
          cumulativeCreditRecordsResponse,
        ] = await Promise.all([
          fetchStorefrontStock(),
          fetchOnlineStorefrontInventory(),
          fetchAllStorefrontsCreditOrdersReport(fixedStartStr, chosenDateStr),
          fetchAllStorefrontsPaidOrdersReport(chosenDateStr, chosenDateStr),
          fetchCreditRecords(chosenDateStr || undefined, chosenDateStr || undefined, "all"),
          fetchCreditRecords(fixedStartStr, chosenDateStr || undefined, "all"),
        ]);

        if (stockResponse.success) setAllStorefrontsStock(stockResponse.data);
        if (onlineStockResponse.success) setOnlineInventory(onlineStockResponse.data);
        setAllStorefrontsCreditOrdersReport(creditResponse);
        setAllStorefrontsPaidOrdersReport(paidResponse);
        if (creditRecordsResponse.success) setCreditRecordsData(creditRecordsResponse.data);
        if (cumulativeCreditRecordsResponse.success) setCumulativeCreditRecordsData(cumulativeCreditRecordsResponse.data);
      } else {
        const isOnline = storefronts.find((s) => s._id === selectedStorefront)?.type === "online";
        if (isOnline) {
          const [onlineStockResponse, paidResponse] = await Promise.all([
            fetchOnlineStorefrontInventory(),
            fetchPaidOrdersReport(selectedStorefront, chosenDateStr, chosenDateStr),
          ]);
          if (onlineStockResponse.success) setOnlineInventory(onlineStockResponse.data);
          setPaidOrdersReport(paidResponse);
          setCreditOrdersReport(null);
          setCreditRecordsData([]);
          setCumulativeCreditRecordsData([]);
        } else {
          const [
            stockResponse,
            creditResponse,
            paidResponse,
            creditRecordsResponse,
            cumulativeCreditRecordsResponse,
          ] = await Promise.all([
            fetchStorefrontStock(selectedStorefront),
            fetchCreditOrdersReport(selectedStorefront, fixedStartStr, chosenDateStr),
            fetchPaidOrdersReport(selectedStorefront, chosenDateStr, chosenDateStr),
            fetchCreditRecords(chosenDateStr || undefined, chosenDateStr || undefined, selectedStorefront),
            fetchCreditRecords(fixedStartStr, chosenDateStr || undefined, selectedStorefront),
          ]);
          if (stockResponse.success) setStorefrontStock(stockResponse.data);
          setOnlineInventory([]);
          setCreditOrdersReport(creditResponse);
          setPaidOrdersReport(paidResponse);
          if (creditRecordsResponse.success) setCreditRecordsData(creditRecordsResponse.data);
          if (cumulativeCreditRecordsResponse.success) setCumulativeCreditRecordsData(cumulativeCreditRecordsResponse.data);
        }
      }
    } catch (error) {
      console.error("Error loading revenue data:", error);
      toast.error("Failed to load revenue data");
    } finally {
      setLoadingRevenue(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (selectedStorefront !== "all") {
      if (tab === "paid" && !paidOrdersReport) {
        loadPaidOrdersReport();
      } else if (tab === "credit" && !creditOrdersReport) {
        loadCreditOrdersReport();
      } else if (tab === "statistics" && !productSalesStatistics) {
        loadProductSalesStatistics();
      } else if (tab === "revenue") {
        loadRevenueData();
      }
    } else {
      if (tab === "paid" && !allStorefrontsPaidOrdersReport) {
        loadAllStorefrontsPaidOrdersReport();
      } else if (tab === "credit" && !allStorefrontsCreditOrdersReport) {
        loadAllStorefrontsCreditOrdersReport();
      } else if (tab === "statistics" && !allStorefrontsProductSalesStatistics) {
        loadAllStorefrontsProductSalesStatistics();
      } else if (tab === "revenue") {
        loadRevenueData();
      }
    }
  };

  const handleRefresh = () => {
    loadReports();
    if (activeTab === "paid") {
      if (selectedStorefront === "all") loadAllStorefrontsPaidOrdersReport();
      else loadPaidOrdersReport();
    } else if (activeTab === "credit") {
      if (selectedStorefront === "all") loadAllStorefrontsCreditOrdersReport();
      else loadCreditOrdersReport();
    } else if (activeTab === "statistics") {
      if (selectedStorefront === "all") loadAllStorefrontsProductSalesStatistics();
      else loadProductSalesStatistics();
    } else if (activeTab === "revenue") {
      loadRevenueData();
    }
  };

  const handleDateRangeChange = (newStartDate: Date | null, newEndDate: Date | null) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const isDataFullyLoaded = () => {
    if (activeTab === "revenue") {
      const currentStock = selectedStorefront === "all" ? allStorefrontsStock : storefrontStock;
      const hasStockData = currentStock.length > 0 || onlineInventory.length > 0;
      const hasPaidOrdersData = selectedStorefront === "all" ? !!allStorefrontsPaidOrdersReport : !!paidOrdersReport;
      return hasStockData && hasPaidOrdersData;
    }
    return true;
  };

  const shouldShowLoading = loading || (activeTab === "revenue" && loadingRevenue);

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
    },
  );

  const filteredReports = selectedStorefront === "all"
    ? saleReports
    : saleReports.filter((report) => report.data.storefront._id === selectedStorefront);

  const displayReport = selectedStorefront === "all"
    ? allStorefrontsReport?.data.report || aggregatedReport
    : filteredReports[0]?.data.report || aggregatedReport;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <ReportsHeader
        storefronts={storefronts}
        selectedStorefront={selectedStorefront}
        onStorefrontChange={setSelectedStorefront}
        onRefresh={handleRefresh}
        loading={shouldShowLoading}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        singleDate={activeTab === "revenue"}
      />

      <ReportTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "overall" && (
        <OverallReportTab
          displayReport={displayReport}
          saleReports={saleReports}
          allStorefrontsReport={allStorefrontsReport}
          selectedStorefront={selectedStorefront}
        />
      )}

      {activeTab === "paid" && (
        <PaidOrdersTab
          paidOrdersReport={selectedStorefront === "all" ? allStorefrontsPaidOrdersReport : paidOrdersReport}
          loading={loadingPaidOrders}
        />
      )}

      {activeTab === "credit" && (
        <CreditOrdersTab
          creditOrdersReport={selectedStorefront === "all" ? allStorefrontsCreditOrdersReport : creditOrdersReport}
          loading={loadingCreditOrders}
        />
      )}

      {activeTab === "statistics" && (
        <SaleStatisticsTab
          productSalesStatistics={selectedStorefront === "all" ? allStorefrontsProductSalesStatistics : productSalesStatistics}
          loading={loadingStatistics}
          startDate={startDate}
          endDate={endDate}
          selectedStorefront={selectedStorefront}
        />
      )}

      {activeTab === "foc" && (
        <FOCTab
          focOrders={selectedStorefront === "all" ? allStorefrontsFocOrders : focOrders}
          loading={loadingFOC}
        />
      )}

      {activeTab === "revenue" && (
        <TotalRevenueTab
          storefrontStock={storefrontStock}
          allStorefrontsStock={allStorefrontsStock}
          onlineInventory={onlineInventory}
          selectedStorefront={selectedStorefront}
          loading={shouldShowLoading}
          creditOrdersReport={creditOrdersReport}
          allStorefrontsCreditOrdersReport={allStorefrontsCreditOrdersReport}
          paidOrdersReport={paidOrdersReport}
          allStorefrontsPaidOrdersReport={allStorefrontsPaidOrdersReport}
          totalCreditPaidAmountFromRecords={creditRecordsData.reduce((sum, record) => sum + (record.paidAmount || 0), 0)}
          totalCumulativeCreditPaidAmountFromRecords={cumulativeCreditRecordsData.reduce((sum, record) => sum + (record.paidAmount || 0), 0)}
        />
      )}

      {((activeTab === "paid" && ((selectedStorefront === "all" && !allStorefrontsPaidOrdersReport) || (selectedStorefront !== "all" && !paidOrdersReport))) ||
        (activeTab === "credit" && ((selectedStorefront === "all" && !allStorefrontsCreditOrdersReport) || (selectedStorefront !== "all" && !creditOrdersReport))) ||
        (activeTab === "statistics" && ((selectedStorefront === "all" && !allStorefrontsProductSalesStatistics) || (selectedStorefront !== "all" && !productSalesStatistics))) ||
        (activeTab === "revenue" && ((selectedStorefront === "all" && allStorefrontsStock.length === 0 && onlineInventory.length === 0) || (selectedStorefront !== "all" && storefrontStock.length === 0 && onlineInventory.length === 0)))) && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Store className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">
            {shouldShowLoading ? "Loading revenue data..." : `No data available for ${activeTab === "statistics" ? "sale statistics" : activeTab === "revenue" ? "revenue data" : `${activeTab} orders`} report`}
          </p>
        </div>
      )}
    </div>
  );
};
