import axios from "../axios";

export interface CreditRecordOrder {
  _id: string;
  orderNumber: string;
  finalAmount: number;
  paidAmount: number;
  paymentType: string;
  createdAt: string;
  totalPaidAmount: Record<string, unknown>;
  remainingBalance: number;
}

export interface CreditRecord {
  _id: string;
  orderId: CreditRecordOrder;
  creditPersonId: string;
  paidAmount: number;
  paymentDate: string;
  paymentMethod: string;
  notes: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface CreditPersonaSummary {
  totalCreditRecords: number;
  totalPaidViaCreditRecords: number;
  totalOutstandingAmount: number;
}

export interface CreditPersonaOrder {
  _id: string;
  orderNumber: string;
}

export interface CreditPersonaRecordsData {
  creditPerson: {
    _id: string;
    name: string;
    phone: string;
  };
  orders: CreditPersonaOrder[];
  creditRecords: {
    count: number;
    records: CreditRecord[];
  };
  summary: CreditPersonaSummary;
}

interface FetchCreditPersonaRecordsResponse {
  success: boolean;
  message: string;
  data?: CreditPersonaRecordsData;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const fetchCreditPersonaRecords = async (
  creditPersonId: string
): Promise<FetchCreditPersonaRecordsResponse> => {
  try {
    const response = await axios.get(
      `/credit-persona/${creditPersonId}/credit-records`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching credit persona records:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch credit persona records",
    };
  }
};

