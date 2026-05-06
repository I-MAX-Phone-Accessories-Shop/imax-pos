import axios from "../axios";

export interface TransferLineItem {
  productCode: string;
  quantity: number;
  notes?: string;
}

export interface TransferToOnlineStorefrontPayload {
  sourceWarehouseId: string;
  lineItems: TransferLineItem[];
  notes?: string;
}

interface TransferToOnlineStorefrontResponse {
  success: boolean;
  message: string;
  data?: {
    sourceWarehouseId: string;
    onlineStorefrontId: string;
    transferredItems: any[];
  };
}

export const transferToOnlineStorefront = async (
  payload: TransferToOnlineStorefrontPayload
): Promise<TransferToOnlineStorefrontResponse> => {
  try {
    const response = await axios.post("/online-storefront/transfer", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error transferring to online storefront:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to transfer stock to online storefront",
    };
  }
};
