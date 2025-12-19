import axios from "axios";

interface GRNLineItem {
  productCode: string;
  goodQuantity: number;
  badQuantity: number;
}

interface CreateGRNRequest {
  purchasingId: string;
  lineItems: GRNLineItem[];
  grnDate: string;
  notes: string;
}

interface CreateGRNResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const createGRN = async (
  data: CreateGRNRequest
): Promise<CreateGRNResponse> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
    const url = `${API_BASE_URL}/grn`;

    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error creating GRN:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create GRN",
    };
  }
};
