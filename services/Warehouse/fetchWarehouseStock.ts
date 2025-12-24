import axios from "../axios";

export interface WarehouseStockInventory {
  _id: string;
  productName: string;
  productCode: string;
  SKU: string;
  category: string;
  profitMargin: number | null;
  profitAmount: number | null;
}

export interface WarehouseStockWarehouse {
  _id: string;
  warehouseCode: string;
  warehouseName: string;
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

export const fetchWarehouseStock = async (): Promise<FetchWarehouseStockResponse> => {
  try {
    const response = await axios.get("/warehouse");
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

