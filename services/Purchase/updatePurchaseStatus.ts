import axios from "axios";

interface UpdatePurchaseStatusResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Update the status of a Purchase Order
 * @param {string} id - The ID of the purchase order
 * @param {string} status - The new status (e.g., "arrived", "pending")
 * @returns {Promise<UpdatePurchaseStatusResponse>} Response from API
 */
export const updatePurchaseStatus = async (
  id: string,
  status: string
): Promise<UpdatePurchaseStatusResponse> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
    const url = `${API_BASE_URL}/purchase/${id}/status`;

    const response = await axios.patch(
      url,
      { status },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating purchase status:", error);

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
