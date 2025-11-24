export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export enum PaymentMethod {
  CASH = 'Cash',
  KBZ_PAY = 'KBZPay',
  WAVE_PAY = 'WavePay',
  AYA_PAY = 'AYA Pay',
  UAB_PAY = 'UAB Pay',
  BANK_TRANSFER = 'Bank Transfer',
  CREDIT = 'Credit (Pay Later)'
}

export enum ProductCategory {
  PHONE_COVER = 'Phone Cover',
  TEMPERED_GLASS = 'Tempered Glass',
  CHARGER_CABLE = 'Charger Cable',
  CHARGER_ADAPTER = 'Charger Adapter',
  TWS = 'TWS',
  BLUETOOTH_SPEAKER = 'Bluetooth Speaker',
  OTHER = 'Other'
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  stockWarehouse: number;
  stockShop: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
}

export interface CartItem extends Product {
  qty: number;
  discountedPrice?: number; 
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string; // ISO String
  items: {
    productId: string;
    name: string;
    qty: number;
    price: number;
  }[];
  subtotal: number;
  discountPercent: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
  customerId?: string; // For credit sales
  status: 'COMPLETED' | 'CANCELLED';
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
  dueDate?: string;
}

export interface PaymentLog {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
}

export interface Expense {
  id: string;
  date: string;
  title: string;
  amount: number;
  category: string;
  photo?: string; // Base64 placeholder
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

export interface AppState {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
  logs: AuditLog[];
  currentUser: {
    name: string;
    role: Role;
  };
}