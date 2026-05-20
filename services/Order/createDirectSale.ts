import axios from "../axios";

interface OrderProduct {
  inventoryId: string;
  quantity: number;
  unit?: string;
}

export interface CreateDirectSaleRequest {
  saleType: "direct-sale";
  ordersProducts: OrderProduct[];
  subTotal?: number;
  tax?: number;
  discount?: number;
  finalAmount?: number;
  paidAmount: number;
  extraChange: number;
  paymentType: "credit" | "paid";
  paymentMethod: string;
}

interface CreateDirectSaleResponse {
  success: boolean;
  message: string;
  data?: {
    orderNumber?: string;
    [key: string]: unknown;
  };
}

export const createDirectSale = async (
  data: CreateDirectSaleRequest,
): Promise<CreateDirectSaleResponse> => {
  try {
    const response = await axios.post("/order", data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating direct sale:", error);
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message: err.response?.data?.message || "Failed to create direct sale",
    };
  }
};
