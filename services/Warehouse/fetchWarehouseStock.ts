import axios from "../axios";

export interface WarehouseStockInventory {
  _id: string;
  productName: string;
  productCode: string;
  SKU: string;
  barcode?: string;
  category: string;
  buyingPrice?: number;
  sellingPrice?: number;
  profitMargin: number | null;
  profitAmount: number | null;
}

export interface WarehouseStockWarehouse {
  _id: string;
  locationCode: string;
  locationName: string;
  locationAddress?: string;
  // Legacy support
  warehouseCode?: string;
  warehouseName?: string;
}

export interface WarehouseStockItem {
  _id: string;
  inventoryId: WarehouseStockInventory;
  warehouseId: WarehouseStockWarehouse;
  quantity: number;
  isLowStock: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  availableQuantity: number;
}

interface FetchWarehouseStockResponse {
  success: boolean;
  message: string;
  data: WarehouseStockItem[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const fetchWarehouseStock = async (
  warehouseId?: string
): Promise<FetchWarehouseStockResponse> => {
  try {
    const url = warehouseId
      ? `/warehouse?warehouseId=${warehouseId}`
      : "/warehouse";
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching warehouse stock:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch warehouse stock",
      data: [],
    };
  }
};

