import axios from "../axios";

interface DeleteOrderResponse {
  success: boolean;
  message: string;
}

export const deleteOrder = async (
  orderId: string,
): Promise<DeleteOrderResponse> => {
  try {
    const response = await axios.delete(`/order/${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete order",
    };
  }
};
