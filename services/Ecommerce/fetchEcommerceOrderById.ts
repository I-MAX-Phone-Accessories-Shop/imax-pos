import axios from "../axios";
import type { EcommerceOrder } from "./fetchEcommerceOrders";

interface FetchEcommerceOrderByIdResponse {
  success: boolean;
  message: string;
  data: EcommerceOrder;
}

export const fetchEcommerceOrderById = async (
  orderId: string,
): Promise<FetchEcommerceOrderByIdResponse> => {
  try {
    const response = await axios.get(`ecommerce/admin/orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching ecommerce order by id:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message || "Failed to fetch ecommerce order",
      data: {} as EcommerceOrder,
    };
  }
};

