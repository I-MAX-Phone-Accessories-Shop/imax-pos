import axios from "../axios";

interface UpdatePaidAmountResponse {
    success: boolean;
    message: string;
    data?: any;
}

export const updatePaidAmount = async (
    orderId: string,
    paidAmount: number | string
): Promise<UpdatePaidAmountResponse> => {
    try {
        const response = await axios.patch(`/order/${orderId}/paid-amount`, {
            paidAmount: paidAmount.toString(),
        });
        return response.data;
    } catch (error: any) {
        console.error("Error updating paid amount:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to update paid amount",
        };
    }
};
