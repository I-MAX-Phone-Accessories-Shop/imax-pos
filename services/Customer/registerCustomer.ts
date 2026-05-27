import axios from "../axios";
import type { Customer } from "./fetchCustomers";

export interface RegisterCustomerPayload {
  name: string;
  phone: string;
  password: string;
}

export interface RegisterCustomerResponse {
  success: boolean;
  message: string;
  data?: Customer;
}

export const registerCustomer = async (
  payload: RegisterCustomerPayload,
): Promise<RegisterCustomerResponse> => {
  try {
    const response = await axios.post("/customer/register", payload);
    const body = response.data;

    if (body?.data || body?.success !== false) {
      return {
        success: body.success ?? true,
        message: body.message || "Customer registered successfully",
        data: body.data,
      };
    }

    return body;
  } catch (error: any) {
    console.error("Error registering customer:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message || "Failed to register customer",
    };
  }
};
