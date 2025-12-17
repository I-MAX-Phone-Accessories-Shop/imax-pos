import axios from "axios";
import { ApiPurchaseOrder } from "../../types";

interface FetchPurchasesResponse {
  success: boolean;
  message: string;
  data: ApiPurchaseOrder[];
}

export const fetchPurchases = async (): Promise<FetchPurchasesResponse> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
    const url = `${API_BASE_URL}/purchase`;

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching purchases:", error);
    throw error;
  }
};
