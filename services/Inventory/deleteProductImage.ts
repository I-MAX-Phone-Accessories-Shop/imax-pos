import axios from "../axios";

interface DeleteProductImageBody {
  imageKey: string;
}

interface DeleteProductImageResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const deleteProductImage = async (
  productId: string,
  imageKey: string,
): Promise<DeleteProductImageResponse> => {
  try {
    const response = await axios.delete<DeleteProductImageResponse>(
      `/inventory/${productId}/image`,
      { data: { imageKey } },
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting product image:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete image",
    };
  }
};
