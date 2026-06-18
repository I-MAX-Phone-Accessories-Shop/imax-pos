import axios from "../axios";
import type { Customer } from "./fetchCustomers";

export type CustomerTier = "regular" | "silver" | "gold" | "platinum";

export interface UpdateCustomerTierPayload {
  tier: CustomerTier | null;
}

export interface UpdateCustomerTierResponse {
  success: boolean;
  message: string;
  data?: Customer;
}

export const updateCustomerTier = async (
  customerId: string,
  tier: CustomerTier | null,
): Promise<UpdateCustomerTierResponse> => {
  try {
    const response = await axios.patch(`/customer/${customerId}`, { tier });
    const body = response.data;

    if (body?.data || body?.success !== false) {
      return {
        success: body.success ?? true,
        message: body.message || "Customer tier updated successfully",
        data: body.data,
      };
    }

    return body;
  } catch (error: any) {
    console.error("Error updating customer tier:", error);
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to update customer tier",
    };
  }
};
