import axios from "../axios";

export interface OnlineStorefrontProfile {
  _id: string;
  singletonKey: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  contactEmail?: string | null;
  contactPhone?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface FetchOnlineStorefrontResponse {
  success: boolean;
  message: string;
  data: OnlineStorefrontProfile;
}

export const fetchOnlineStorefront = async (): Promise<FetchOnlineStorefrontResponse> => {
  try {
    const response = await axios.get("/online-storefront");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching online storefront:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch online storefront",
      data: null as any,
    };
  }
};
