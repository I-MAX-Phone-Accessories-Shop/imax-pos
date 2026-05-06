import axios from "../axios";

export interface OnlineStorefrontStockInventory {
  _id: string;
  productName: string;
  productCode: string;
  SKU: string;
  category: string;
  sellingPrice?: number;
  buyingPrice?: number;
  barcode?: string;
}

export interface OnlineStorefrontStockItem {
  _id: string;
  onlineStorefrontId: {
    _id: string;
    name: string;
    status: string;
  };
  inventoryId: OnlineStorefrontStockInventory;
  quantity: number;
  isLowStock: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  availableQuantity: number;
}

interface FetchOnlineStorefrontStockResponse {
  success: boolean;
  message: string;
  data: OnlineStorefrontStockItem[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const fetchOnlineStorefrontInventory = async (
  page?: number,
  limit?: number,
  search?: string
): Promise<FetchOnlineStorefrontStockResponse> => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (search) params.append("search", search);

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await axios.get(`/online-storefront/inventory${query}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching online storefront inventory:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch online storefront inventory",
      data: [],
    };
  }
};
