import axios from "../axios";

export interface UpdateOnlineStorefrontQuantityPayload {
  quantityChange: number;
  reason: string;
}

interface UpdateOnlineStorefrontQuantityResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateOnlineStorefrontQuantity = async (
  stockRecordId: string,
  payload: UpdateOnlineStorefrontQuantityPayload
): Promise<UpdateOnlineStorefrontQuantityResponse> => {
  try {
    const response = await axios.patch(
      `/online-storefront/inventory/${stockRecordId}/quantity`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating online storefront quantity:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to update online storefront quantity",
    };
  }
};
