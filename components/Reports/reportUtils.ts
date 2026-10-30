import {
  CreditRecord,
  CreditRecordPerson,
} from "../../services/Reports/fetchCreditRecords";

export const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cash: "#10b981", // green
  kpay: "#3b82f6", // blue
  kbzpay: "#3b82f6", // blue
  wavepay: "#8b5cf6", // purple
  ayapay: "#f59e0b", // amber
  uabpay: "#ef4444", // red
  bank_transfer: "#6366f1", // indigo
};


// Credit records store the credit person directly; fall back to the order's person
export const getCreditRecordPerson = (
  record: CreditRecord,
): CreditRecordPerson | null =>
  record.creditPersonId || record.orderId?.creditPersonId || null;

// MMK currency, same format as the Reports page
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MMK",
  }).format(amount);
};

export const formatDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Parse YYYY-MM-DD as a local date (new Date("YYYY-MM-DD") would be UTC)
export const parseDateParam = (value: string | null): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
};

export const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
