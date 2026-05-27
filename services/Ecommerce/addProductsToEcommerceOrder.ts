import axios from "../axios";
import type { EcommerceOrder } from "./fetchEcommerceOrders";

export interface EcommerceAddProductItem {
  inventoryId: string;
  quantity: number;
  unitPrice?: number;
}

export interface AddProductsToEcommerceOrderPayload {
  action: "add";
  products: EcommerceAddProductItem[];
}

interface AddProductsToEcommerceOrderResponse {
  success: boolean;
  message: string;
  data?: EcommerceOrder;
}

export const addProductsToEcommerceOrder = async (
  orderId: string,
  payload: AddProductsToEcommerceOrderPayload,
): Promise<AddProductsToEcommerceOrderResponse> => {
  try {
    const response = await axios.patch(
      `ecommerce/admin/orders/${orderId}/products`,
      payload,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error adding products to ecommerce order:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Failed to add products to ecommerce order",
    };
  }
};

