import axios from "../axios";

export interface PurchaseProduct {
  inventoryId: string;
  productName: string;
  buyingPrice: number;
  purchaseQuantity: number;
  productCode: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface PurchaseDetail {
  _id: string;
  supplierId: string;
  products: PurchaseProduct[];
  status: string;
  note: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  id: string;
}

interface FetchPurchaseByIdResponse {
  success: boolean;
  message: string;
  data: PurchaseDetail | null;
}

export const fetchPurchaseById = async (
  purchaseId: string
): Promise<FetchPurchaseByIdResponse> => {
  try {
    const response = await axios.get(`/purchase/${purchaseId}`);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching purchase:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch purchase",
      data: null,
    };
  }
};
