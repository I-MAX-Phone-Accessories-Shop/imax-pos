import axios from "../axios";
import { OnlineOrder } from "./fetchOnlineOrders";

interface FetchOnlineOrderByIdResponse {
  success: boolean;
  data: OnlineOrder;
}

export const fetchOnlineOrderById = async (
  id: string,
): Promise<FetchOnlineOrderByIdResponse> => {
  try {
    const response = await axios.get(`/online-orders/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching online order details:", error);
    throw error;
  }
};

interface UpdateOnlineOrderStatusResponse {
  success: boolean;
  message: string;
  data: OnlineOrder;
}

export const updateOnlineOrderStatus = async (
  id: string,
  status: string,
): Promise<UpdateOnlineOrderStatusResponse> => {
  try {
    const response = await axios.patch(`/online-orders/${id}/status`, {
      status,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating online order status:", error);
    throw error;
  }
};

interface EditOnlineOrderItemsResponse {
  success: boolean;
  message: string;
  data: OnlineOrder;
}

export const addOnlineOrderItems = async (
  id: string,
  data: {
    items: { inventoryId: string; quantity: number }[];
    subTotal: number;
    tax: number;
    discount: number;
    finalAmount: number;
  },
): Promise<EditOnlineOrderItemsResponse> => {
  try {
    const response = await axios.post(`/online-orders/${id}/items/add`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error adding items to online order:", error);
    throw error;
  }
};

export const removeOnlineOrderItems = async (
  id: string,
  data: {
    items: { inventoryId: string; quantity: number }[];
    subTotal: number;
    tax: number;
    discount: number;
    finalAmount: number;
  },
): Promise<EditOnlineOrderItemsResponse> => {
  try {
    const response = await axios.post(
      `/online-orders/${id}/items/remove`,
      data,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error removing items from online order:", error);
    throw error;
  }
};
