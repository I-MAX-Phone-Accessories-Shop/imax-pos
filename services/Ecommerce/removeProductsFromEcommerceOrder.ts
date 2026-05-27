import axios from "../axios";
import type { EcommerceOrder } from "./fetchEcommerceOrders";

export interface EcommerceRemoveProductItem {
  inventoryId: string;
  quantity: number;
}

export interface RemoveProductsFromEcommerceOrderPayload {
  action: "remove";
  products: EcommerceRemoveProductItem[];
}

interface RemoveProductsFromEcommerceOrderResponse {
  success: boolean;
  message: string;
  data?: EcommerceOrder;
}

export const removeProductsFromEcommerceOrder = async (
  orderId: string,
  payload: RemoveProductsFromEcommerceOrderPayload,
): Promise<RemoveProductsFromEcommerceOrderResponse> => {
  try {
    const response = await axios.patch(
      `ecommerce/admin/orders/${orderId}/products`,
      payload,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error removing products from ecommerce order:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Failed to remove products from ecommerce order",
    };
  }
};

