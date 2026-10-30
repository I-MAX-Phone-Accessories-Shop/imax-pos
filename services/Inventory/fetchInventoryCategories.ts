import axios from "../axios";

export interface InventoryCategoriesResponse {
  success: boolean;
  message?: string;
  data: {
    categories: string[];
    subCategories: Record<string, string[]>;
  };
}

/**
 * Fetch every distinct product category and the subcategories under each
 */
export const fetchInventoryCategories =
  async (): Promise<InventoryCategoriesResponse> => {
    try {
      const response = await axios.get("/inventory/categories");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching inventory categories:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch categories",
        data: { categories: [], subCategories: {} },
      };
    }
  };
