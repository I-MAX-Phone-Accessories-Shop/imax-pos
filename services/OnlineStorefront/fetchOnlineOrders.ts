import axios from "../axios";

export interface OnlineOrderProduct {
  inventoryId: {
    _id: string;
    productName: string;
    productCode: string;
    SKU: string;
    images?: { url: string; key: string; isPrimary: boolean }[];
    id: string;
  };
  quantity: number;
  unitPrice: number;
  _id: string;
}

export interface OnlineOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  ordersProducts: OnlineOrderProduct[];
  subTotal: number;
  tax: number;
  discount: number;
  finalAmount: number;
  orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "partially_paid";
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FetchOnlineOrdersResponse {
  success: boolean;
  count: number;
  data: OnlineOrder[];
}

export const fetchOnlineOrders = async (
  status?: string,
  search?: string
): Promise<FetchOnlineOrdersResponse> => {
  try {
    let url = "/online-orders";
    const params = new URLSearchParams();

    if (status && status !== "all") {
      params.append("status", status);
    }
    if (search) {
      params.append("search", search);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching online orders:", error);
    return {
      success: false,
      count: 0,
      data: [],
    };
  }
};
