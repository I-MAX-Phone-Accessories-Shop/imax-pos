import axios from "../axios";

export interface SaleReportStorefront {
  _id: string;
  locationName: string;
  locationCode: string;
}

export interface SaleReportDateRange {
  startDate: string | null;
  endDate: string | null;
}

export interface SaleReportData {
  finalAmount: number;
  paidAmount: number;
  subTotal: number;
  tax: number;
  discount: number;
  extraChange: number;
  orderCount: number;
  creditOrderCount: number;
  paidOrderCount: number;
}

export interface SaleReportResponse {
  success: boolean;
  message: string;
  data: {
    storefront: SaleReportStorefront;
    dateRange: SaleReportDateRange;
    report: SaleReportData;
  };
}

/**
 * Fetch sale report for a specific storefront
 * @param {string} storefrontId - The ID of the storefront
 * @returns {Promise<SaleReportResponse>} Response from API
 */
export const fetchSaleReport = async (
  storefrontId: string
): Promise<SaleReportResponse> => {
  try {
    const response = await axios.get(`/sale-report/storefront/${storefrontId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching sale report:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch sale report",
      data: {
        storefront: {
          _id: storefrontId,
          locationName: "Unknown",
          locationCode: "N/A",
        },
        dateRange: {
          startDate: null,
          endDate: null,
        },
        report: {
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
      },
    };
  }
};

