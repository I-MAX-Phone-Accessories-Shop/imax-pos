import axios from "../axios";

export interface CreditRemainingCustomer {
    creditPerson: {
        _id: string;
        name: string;
        phone: string;
    } | null;
    unpaidOrderCount: number;
    totalCredit: number;
    totalPaid: number;
    remaining: number;
    oldestUnpaidOrderDate: string | null;
}

export interface CreditRemainingResponse {
    success: boolean;
    message: string;
    data: {
        dateRange: {
            startDate: string | null;
            endDate: string | null;
        };
        totals: {
            totalRemaining: number;
            customerCount: number;
            unpaidOrderCount: number;
        };
        customers: CreditRemainingCustomer[];
    };
}

export const fetchCreditRemaining = async (
    startDate?: string,
    endDate?: string,
    storefrontId?: string
): Promise<CreditRemainingResponse> => {
    try {
        const params = new URLSearchParams();
        if (storefrontId && storefrontId !== "all") params.append("storefrontId", storefrontId);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);

        const response = await axios.get(`/sale-report/credit-remaining?${params.toString()}`);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching credit remaining:", error);
        return {
            success: false,
            message:
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch credit remaining",
            data: {
                dateRange: { startDate: null, endDate: null },
                totals: { totalRemaining: 0, customerCount: 0, unpaidOrderCount: 0 },
                customers: [],
            },
        };
    }
};
