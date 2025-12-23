import axios from "../axios";

export interface OrderProduct {
  inventoryId: {
    _id: string;
    productName: string;
    productCode: string;
    SKU: string;
    profitMargin: number | null;
    profitAmount: number | null;
    id: string;
  };
  quantity: number;
  unitPrice: number;
  _id: string;
}

export interface OrderStorefront {
  storefrontCode: string;
  storefrontName: string;
  id: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  storefrontId: OrderStorefront;
  ordersProducts: OrderProduct[];
  subTotal: number;
  tax: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  extraChange: number;
  orderStatus: string;
  isDeleted: boolean;
  deletedAt: string | null;
  paymentType: string;
  createdAt: string;
  updatedAt: string;
  id: string;
}

interface FetchOrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
}

export const fetchOrders = async (): Promise<FetchOrdersResponse> => {
  try {
    const response = await axios.get("/order");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch orders",
      data: [],
    };
  }
};

