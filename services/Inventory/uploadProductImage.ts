import axios from "../axios";

interface UploadProductImageResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const uploadProductImage = async (
  productId: string,
  file: File,
): Promise<UploadProductImageResponse> => {
  try {
    const formData = new FormData();
    formData.append("images", file);

    const response = await axios.patch<UploadProductImageResponse>(
      `/inventory/${productId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error("Error uploading product image:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to upload image",
    };
  }
};
