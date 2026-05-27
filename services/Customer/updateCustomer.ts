import axios from "../axios";
import type { Customer, CustomerAddress } from "./fetchCustomers";

export interface UpdateCustomerPayload {
  name: string;
  phone: string;
  addresses: CustomerAddress[];
}

export interface UpdateCustomerResponse {
  success: boolean;
  message: string;
  data?: Customer;
}

export const updateCustomer = async (
  customerId: string,
  payload: UpdateCustomerPayload,
): Promise<UpdateCustomerResponse> => {
  try {
    const response = await axios.patch(`/customer/${customerId}`, payload);
    const body = response.data;

    if (body?.data || body?.success !== false) {
      return {
        success: body.success ?? true,
        message: body.message || "Customer updated successfully",
        data: body.data,
      };
    }

    return body;
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to update customer",
    };
  }
};

