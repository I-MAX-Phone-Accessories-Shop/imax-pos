import axios from "../axios";

export interface StorefrontStockInventory {
  _id: string;
  productName: string;
  productCode: string;
  SKU: string;
  category: string;
  profitMargin: number | null;
  profitAmount: number | null;
  sellingPrice?: number;
}

export interface StorefrontStockStorefront {
  _id: string;
  locationCode: string;
  locationName: string;
  // Legacy support
  storefrontCode?: string;
  storefrontName?: string;
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

export const fetchStorefrontStock = async (
  storefrontId?: string
): Promise<FetchStorefrontStockResponse> => {
  try {
    const url = storefrontId
      ? `/storefront-inventory?storefrontId=${storefrontId}`
      : "/storefront-inventory";
    const response = await axios.get(url);
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
