import axios from "../axios";

export type EcommercePurchaseResetMode = "manual" | "timeline";

export type UpdateInventoryEcommerceLimitPayload =
  | {
      ecommerceMaxPerUser: number;
      ecommercePurchaseResetMode: "manual";
    }
  | {
      ecommerceMaxPerUser: number;
      ecommercePurchaseResetMode: "timeline";
      ecommercePurchaseResetDays: number;
    };

interface UpdateInventoryEcommerceLimitResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export const updateInventoryEcommerceLimit = async (
  inventoryId: string,
  payload: UpdateInventoryEcommerceLimitPayload,
): Promise<UpdateInventoryEcommerceLimitResponse> => {
  try {
    const response = await axios.patch(
      `/inventory/${inventoryId}`,
      payload,
    );
    return response.data;
  } catch (error: unknown) {
    console.error("Error updating inventory ecommerce limit:", error);
    const message =
      axios.isAxiosError(error) && error.response?.data?.message
        ? String(error.response.data.message)
        : "Failed to update ecommerce purchase limit";
    return { success: false, message };
  }
};
