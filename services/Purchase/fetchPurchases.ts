import axios from "../axios";
import { ApiPurchaseOrder } from "../../types";

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface FetchPurchasesResponse {
  success: boolean;
  message: string;
  data: ApiPurchaseOrder[];
  pagination: PaginationData;
}

interface FetchPurchasesParams {
  page?: number;
  limit?: number;
  isDeleted?: boolean;
}

export const fetchPurchases = async (
  params?: FetchPurchasesParams
): Promise<FetchPurchasesResponse> => {
  try {
    const { page = 1, limit = 10, isDeleted } = params || {};
    let url = `/purchase?page=${page}&limit=${limit}`;

    if (isDeleted !== undefined) {
      url += `&isDeleted=${isDeleted}`;
    }

    const response = await axios.get(url);

    return response.data;
  } catch (error) {
    console.error("Error fetching purchases:", error);
    throw error;
  }
};
