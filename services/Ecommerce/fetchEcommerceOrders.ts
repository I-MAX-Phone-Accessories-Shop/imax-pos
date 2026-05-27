import axios from "../axios";

export type EcommerceOrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface EcommerceOrderCustomer {
  _id: string;
  name: string;
  phone: string;
}

export interface EcommerceOrderProductInventory {
  productName: string;
  productCode: string;
  SKU?: string;
  images?: Array<{
    url: string;
    key?: string;
    isPrimary?: boolean;
    _id?: string;
    id?: string;
  }>;
}

export interface EcommerceOrderProduct {
  inventoryId: EcommerceOrderProductInventory;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface EcommerceOrderShippingAddress {
  label: string;
  addressLine: string;
  city: string;
  phone: string;
}

export interface EcommerceOrder {
  _id: string;
  orderNumber: string;
  customerId: EcommerceOrderCustomer | null;
  products: EcommerceOrderProduct[];
  totalAmount: number;
  status: EcommerceOrderStatus;
  paymentMethod: string;
  paymentStatus: "paid" | "unpaid" | string;
  shippingAddress: EcommerceOrderShippingAddress | null;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EcommerceOrderPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface FetchEcommerceOrdersResponse {
  success: boolean;
  message: string;
  data: EcommerceOrder[];
  pagination?: EcommerceOrderPagination;
}

export interface FetchEcommerceOrdersQuery {
  page?: number;
  limit?: number;
  status?: EcommerceOrderStatus | "all";
  search?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export const fetchEcommerceOrders = async (
  query: FetchEcommerceOrdersQuery,
): Promise<FetchEcommerceOrdersResponse> => {
  try {
    const params = new URLSearchParams();
    params.append("page", String(query.page ?? 1));
    params.append("limit", String(query.limit ?? 20));

    if (query.status && query.status !== "all") {
      params.append("status", query.status);
    }
    if (query.search && query.search.trim()) {
      params.append("search", query.search.trim());
    }
    if (query.startDate) {
      params.append("startDate", query.startDate);
    }
    if (query.endDate) {
      params.append("endDate", query.endDate);
    }

    const response = await axios.get(
      `ecommerce/admin/orders?${params.toString()}`,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching ecommerce orders:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message || "Failed to fetch ecommerce orders",
      data: [],
    };
  }
};
