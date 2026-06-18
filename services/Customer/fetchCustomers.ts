import axios from "../axios";

export interface CustomerAddress {
  label: string;
  addressLine: string;
  city: string;
  isDefault?: boolean;
  _id?: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  addresses: CustomerAddress[];
  isActive: boolean;
  tier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface FetchCustomersQuery {
  page?: number;
  limit?: number;
}

export interface FetchCustomersResponse {
  success: boolean;
  message: string;
  data: Customer[];
  pagination?: CustomerPagination;
}

export const fetchCustomers = async (
  query: FetchCustomersQuery = {},
): Promise<FetchCustomersResponse> => {
  try {
    const params = new URLSearchParams();
    params.append("page", String(query.page ?? 1));
    params.append("limit", String(query.limit ?? 20));

    const response = await axios.get(`/customer?${params.toString()}`);
    const body = response.data;

    if (Array.isArray(body?.data)) {
      return {
        success: body.success ?? true,
        message: body.message || "",
        data: body.data,
        pagination: body.pagination,
      };
    }

    return body;
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch customers",
      data: [],
    };
  }
};
