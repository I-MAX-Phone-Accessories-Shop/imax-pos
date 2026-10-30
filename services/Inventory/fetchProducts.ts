import axios from "../axios";
import { Product } from "../../types";

export interface ProductsPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface FetchProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
  pagination: ProductsPagination;
}

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

/**
 * Fetch one page of products from API (the backend caps limit at 100)
 * @returns {Promise<FetchProductsResponse>} Response from API with products data and pagination
 */
export const fetchProducts = async ({
  page,
  limit = 100,
  search,
  category,
}: FetchProductsParams = {}): Promise<FetchProductsResponse> => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search && search.trim()) params.append("search", search.trim());
    if (category && category !== "All") params.append("category", category);

    const response = await axios.get(`/inventory?${params.toString()}`);

    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);

    if (axios.isAxiosError(error)) {
      if (
        error.response &&
        error.response.headers["content-type"] &&
        error.response.headers["content-type"].includes("text/html")
      ) {
        throw new Error(
          `API endpoint not found. Please check if the API is running and the endpoint "${error.config?.url}" is correct.`,
        );
      }

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP error! status: ${error.response.status}`;
        throw new Error(errorMessage);
      }

      if (error.request) {
        throw new Error(
          "Network error: Unable to reach the API. Please check if the API server is running.",
        );
      }
    }

    throw error;
  }
};

/**
 * Fetch every product by walking all pages. Only for pickers that need the full list.
 */
export const fetchAllProducts = async (): Promise<FetchProductsResponse> => {
  const firstPage = await fetchProducts({ page: 1 });
  if (!firstPage.success) return firstPage;

  const allProducts = [...(firstPage.data || [])];
  let currentPage = firstPage.pagination?.currentPage || 1;
  const totalPages = firstPage.pagination?.totalPages || 1;

  while (currentPage < totalPages) {
    const nextPage = await fetchProducts({ page: currentPage + 1 });
    if (!nextPage.success) return nextPage;
    allProducts.push(...(nextPage.data || []));
    currentPage = nextPage.pagination?.currentPage || currentPage + 1;
  }

  return {
    ...firstPage,
    data: allProducts,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: allProducts.length,
      itemsPerPage: allProducts.length,
    },
  };
};
