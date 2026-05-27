import axios from "../axios";
import type {
  EcommerceOrder,
  EcommerceOrderStatus,
} from "./fetchEcommerceOrders";

export interface UpdateEcommerceOrderStatusPayload {
  status: EcommerceOrderStatus;
}

export interface UpdateEcommerceOrderStatusResponse {
  success: boolean;
  message: string;
  data?: EcommerceOrder;
}

export const updateEcommerceOrderStatus = async (
  orderId: string,
  payload: UpdateEcommerceOrderStatusPayload,
): Promise<UpdateEcommerceOrderStatusResponse> => {
  try {
    const response = await axios.patch(
      `ecommerce/admin/orders/${orderId}/status`,
      payload,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating ecommerce order status:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Failed to update ecommerce order status",
    };
  }
};
