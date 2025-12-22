import axios from "../axios";

export interface StorefrontStockInventory {
  _id: string;
  productName: string;
  productCode: string;
  SKU: string;
  category: string;
  profitMargin: number | null;
  profitAmount: number | null;
  id: string;
}

export interface StorefrontStockStorefront {
  storefrontCode: string;
  storefrontName: string;
  id: string;
}

export interface StorefrontStockItem {
  _id: string;
  storefrontId: StorefrontStockStorefront;
  inventoryId: StorefrontStockInventory;
  quantity: number;
  isLowStock: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  availableQuantity: number;
  id: string;
}

interface FetchStorefrontStockResponse {
  success: boolean;
  message: string;
  data: StorefrontStockItem[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const fetchStorefrontStock = async (): Promise<FetchStorefrontStockResponse> => {
  try {
    const response = await axios.get("/storefront-inventory");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching storefront stock:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch storefront stock",
      data: [],
    };
  }
};
