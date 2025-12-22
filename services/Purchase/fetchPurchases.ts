import axios from "../axios";
import { ApiPurchaseOrder } from "../../types";

interface FetchPurchasesResponse {
  success: boolean;
  message: string;
  data: ApiPurchaseOrder[];
}

export const fetchPurchases = async (): Promise<FetchPurchasesResponse> => {
  try {
    const response = await axios.get("/purchase");

    return response.data;
  } catch (error) {
    console.error("Error fetching purchases:", error);
    throw error;
  }
};
