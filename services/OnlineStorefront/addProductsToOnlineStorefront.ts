import axios from "../axios";

export interface AddProductsToOnlineStorefrontPayload {
  inventoryIds: string[];
}

interface AddProductsToOnlineStorefrontResponse {
  success: boolean;
  message: string;
  data?: {
    created: any[];
    alreadyExists: any[];
    summary: {
      total: number;
      created: number;
      alreadyExists: number;
    };
  };
}

export const addProductsToOnlineStorefront = async (
  payload: AddProductsToOnlineStorefrontPayload
): Promise<AddProductsToOnlineStorefrontResponse> => {
  try {
    const response = await axios.post("/online-storefront/inventory", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error adding products to online storefront:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to add products to online storefront",
    };
  }
};
