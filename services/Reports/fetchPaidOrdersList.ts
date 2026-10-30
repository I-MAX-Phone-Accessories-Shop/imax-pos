import axios from "../axios";

export interface PaidOrderListItem {
    _id: string;
    orderNumber: string;
    createdAt: string;
    storefront: {
        _id: string;
        locationName: string;
        locationCode: string;
    } | null;
    itemCount: number;
    paymentMethod: string;
    finalAmount: number;
    paidAmount: number;
    extraChange: number;
    // Paid amount minus change given back
    netAmount: number;
    soldBy: { _id: string; name: string } | null;
}

export interface PaidOrdersPaymentMethodTotal {
    paymentMethod: string;
    totalPaidAmount: number;
    totalNetAmount: number;
    orderCount: number;
}

export interface PaidOrdersListResponse {
    success: boolean;
    message: string;
    data: {
        dateRange: {
            startDate: string | null;
            endDate: string | null;
        };
        totals: {
            totalPaidAmount: number;
            totalNetAmount: number;
            totalFinalAmount: number;
            totalExtraChange: number;
            orderCount: number;
        };
        paymentMethods: PaidOrdersPaymentMethodTotal[];
        orders: PaidOrderListItem[];
    };
}

export const fetchPaidOrdersList = async (
    startDate?: string,
    endDate?: string,
    storefrontId?: string
): Promise<PaidOrdersListResponse> => {
    try {
        const params = new URLSearchParams();
        if (storefrontId && storefrontId !== "all") params.append("storefrontId", storefrontId);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const response = await axios.get(`/sale-report/paid-orders/list?${params.toString()}`);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching paid orders list:", error);
        return {
            success: false,
            message:
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch paid orders",
            data: {
                dateRange: { startDate: null, endDate: null },
                totals: {
                    totalPaidAmount: 0,
                    totalNetAmount: 0,
                    totalFinalAmount: 0,
                    totalExtraChange: 0,
                    orderCount: 0,
                },
                paymentMethods: [],
                orders: [],
            },
        };
    }
};
