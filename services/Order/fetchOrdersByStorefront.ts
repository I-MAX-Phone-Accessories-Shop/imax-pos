import axios from "../axios";
import { Order } from "./fetchOrders";

interface FetchOrdersByStorefrontResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    orders: Order[];
  } | null;
}

export const fetchOrdersByStorefront = async (
  storefrontId: string
): Promise<FetchOrdersByStorefrontResponse> => {
  try {
    const response = await axios.get(`/order/storefront/${storefrontId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching orders by storefront:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch orders",
      data: null,
    };
  }
};

