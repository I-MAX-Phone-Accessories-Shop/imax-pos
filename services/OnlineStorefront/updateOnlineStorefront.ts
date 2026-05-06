import axios from "../axios";

export interface UpdateOnlineStorefrontPayload {
  name?: string;
  status?: "active" | "inactive";
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
}

interface UpdateOnlineStorefrontResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateOnlineStorefront = async (
  payload: UpdateOnlineStorefrontPayload
): Promise<UpdateOnlineStorefrontResponse> => {
  try {
    const response = await axios.patch("/online-storefront", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error updating online storefront:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update online storefront",
    };
  }
};
