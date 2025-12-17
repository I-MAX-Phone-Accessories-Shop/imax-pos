import axios from "axios";

export interface PurchaseProductPayload {
  inventoryId: string;
  purchaseQuantity: number;
}

export interface CreatePurchasePayload {
  products: PurchaseProductPayload[];
  supplierId: string;
  note?: string;
  totalAmount: number;
}

interface CreatePurchaseResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Create a new Purchase Order (PO) via API
 * @param {CreatePurchasePayload} payload
 * @returns {Promise<CreatePurchaseResponse>} Response from API
 */
export const createPurchase = async (
  payload: CreatePurchasePayload
): Promise<CreatePurchaseResponse> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
    const url = `${API_BASE_URL}/purchase`;

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating purchase order:", error);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP error! status: ${error.response.status}`;
        throw new Error(errorMessage);
      }
      if (error.request) {
        throw new Error(
          "Network error: Unable to reach the API. Please check if the API server is running."
        );
      }
    }

    throw error;
  }
};
