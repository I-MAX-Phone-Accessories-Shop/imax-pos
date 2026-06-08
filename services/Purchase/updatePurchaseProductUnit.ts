import axios from "../axios";

interface UpdateProductUnitPayload {
  productId: string;
  unit: string;
}

interface UpdatePurchaseProductUnitResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Update unit for a product in a Purchase Order
 * @param {string} purchaseId - The PO ID
 * @param {UpdateProductUnitPayload} payload - Product ID and new unit
 * @returns {Promise<UpdatePurchaseProductUnitResponse>} Response from API
 */
export const updatePurchaseProductUnit = async (
  purchaseId: string,
  payload: UpdateProductUnitPayload
): Promise<UpdatePurchaseProductUnitResponse> => {
  try {
    const response = await axios.patch(
      `/purchase/${purchaseId}/product-unit`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating purchase product unit:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to update product unit",
    };
  }
};
