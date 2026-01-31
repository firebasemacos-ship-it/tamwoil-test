
// lib/types.ts
export interface Manager {
  id: string;
  name: string;
  username: string;
  password: string;
  phone?: string;
  permissions?: string[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  phone: string;
  address?: string; // Added address field
  orderCount: number;
  debt: number;
  orderCounter?: number; // Counter for sequential order numbers
}

export interface Representative {
  id: string;
  name: string;
  username: string;
  password: string;
  phone: string;
  assignedOrders: number;
}

export type OrderStatus =
  | 'pending'
  | 'processed'
  | 'ready'
  | 'shipped'
  | 'arrived_dubai'
  | 'arrived_benghazi'
  | 'arrived_tobruk'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'paid';

export interface Order {
  id: string;
  invoiceNumber: string; // The new sequential invoice number per user
  trackingId: string;
  userId: string;
  customerName: string;
  operationDate: string; // ISO String
  sellingPriceLYD: number;
  remainingAmount: number;
  status: OrderStatus;
  productLinks: string;
  exchangeRate: number; // Exchange rate at the time of order creation
  // Optional detailed fields from form
  purchasePriceUSD?: number;
  downPaymentLYD?: number;
  weightKG?: number;
  pricePerKilo?: number;
  pricePerKiloCurrency?: 'LYD' | 'USD';
  customerWeightCost?: number;
  customerWeightCostCurrency?: 'LYD' | 'USD';
  companyWeightCost?: number; // Total cost paid by company (kept for backward compatibility or if LYD is strictly needed)
  companyWeightCostUSD?: number; // Total cost paid by company in USD
  companyPricePerKilo?: number; // Cost per kilo for company (LYD - deprecated/optional)
  companyPricePerKiloUSD?: number; // Cost per kilo for company in USD
  customerPricePerKilo?: number; // Price per kilo for customer (LYD)
  addedCostUSD?: number; // New field for additional costs in USD
  addedCostNotes?: string; // Notes for the added cost
  store?: string;
  paymentMethod?: string;
  deliveryDate?: string | null; // ISO String
  itemDescription?: string;
  shippingCostLYD?: number;
  representativeId?: string | null;
  representativeName?: string | null;
  customerAddress?: string; // Added for representative view
  customerPhone?: string; // Added for representative view
  collectedAmount?: number; // Amount collected by representative
  customerWeightCostUSD?: number;
}


export interface Transaction {
  id: string;
  orderId?: string | null;
  customerId: string;
  customerName: string;
  date: string; // ISO String
  type: 'order' | 'payment';
  status: OrderStatus | 'paid';
  amount: number;
  description: string;
}

export interface SubOrder {
  subOrderId: string;
  trackingId?: string;
  username: string;
  password?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  purchasePriceUSD: number;
  sellingPriceLYD: number;
  downPaymentLYD: number;
  paymentMethod: string;
  shipmentStatus: OrderStatus;
  selectedStore: string;
  manualStoreName: string;
  productLinks: string;
  operationDate?: string; // ISO String
  deliveryDate?: string; // ISO String
  itemDescription: string;
  weightKG: number;
  pricePerKiloUSD: number;
  remainingAmount: number;
  representativeId?: string | null;
  representativeName?: string | null;
  invoiceName?: string; // For providing context in rep dashboard
}

export interface TempOrder {
  id: string;
  invoiceName: string;
  totalAmount: number;
  remainingAmount: number;
  status: OrderStatus;
  subOrders: SubOrder[];
  createdAt: string; // ISO String of when it was created
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  parentInvoiceId?: string | null; // The ID of the main order it's converted to
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: string; // ISO string
}

export interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: string; // ISO string
  unreadCount: number;
  messages: Message[];
}

export interface Notification {
  id: string;
  message: string;
  target: 'all' | 'specific';
  userId: string | null;
  timestamp: string;
  isRead: boolean;
}

export interface AppSettings {
  // Basic exchange rate for orders and shipments
  exchangeRate: number;
  pricePerKiloLYD: number;
  pricePerKiloUSD: number;

  // Cards exchange rates
  cardsExchangeRateCash: number;
  cardsExchangeRateBank: number;
  cardsExchangeRateBalance: number;

  // Products exchange rates
  productsExchangeRateCash: number;
  productsExchangeRateBank: number;
  productsExchangeRateBalance: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO String
}

export type DepositStatus = 'pending' | 'collected' | 'cancelled';

export interface Deposit {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  date: string; // ISO String
  description: string;
  status: DepositStatus;
  representativeId: string | null;
  representativeName: string | null;
  collectedBy: 'admin' | 'representative';
  collectedDate: string | null;
}

export type ExternalDebtStatus = 'pending' | 'paid' | 'payment';

export type AccountType = 'cash' | 'bank' | 'usd';

export interface ExternalDebt {
  id: string;
  creditorId: string;
  creditorName: string;
  amount: number;
  date: string; // ISO String
  status: ExternalDebtStatus;
  notes: string;
  accountType: AccountType; // Type of account: cash, bank, or USD
}

export interface Creditor {
  id: string;
  name: string;
  type: 'company' | 'person';
  currency: 'LYD' | 'USD';
  totalDebt: number;
  contactInfo?: string;
}


export interface ManualShippingLabel {
  id: string;
  invoiceNumber: string;
  operationDate: string; // ISO String
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  itemDescription: string;
  trackingId: string;
  sellingPriceLYD: number;
  remainingAmount: number;
}

export interface InstantSale {
  id: string;
  productName: string;
  costUSD: number;
  costExchangeRate: number;
  totalCostLYD: number;
  salePriceMode: 'LYD' | 'USD';
  salePriceLYD: number;
  salePriceUSD: number;
  saleExchangeRate: number;
  finalSalePriceLYD: number;
  netProfit: number;
  createdAt: string; // ISO String
}

export interface Card {
  id: string;
  category: string; // e.g., "Games", "Apps"
  service: string; // e.g., "PUBG", "Google Play"
  name: string; // e.g., "60 UC", "$10"
  code: string; // The redeem code
  price: number; // Selling price
  cost: number; // Cost price
  currency: 'LYD' | 'USD';
  status: 'available' | 'sold';
  soldToUserId?: string | null;
  soldToUserName?: string | null;
  soldAt?: string | null; // ISO String
  image?: string; // Optional image URL
  createdAt: string; // ISO String
}

export interface CardVariant {
  id: string;
  name: string; // e.g., "Lite", "Plus", "60 UC"
  costUSD: number;
}

export interface CardPackage {
  id: string;
  service: string; // e.g., "PUBG Mobile"
  category: string;
  variants: CardVariant[];
  image?: string;
  profitMarginCash: number;
  profitMarginBank: number;
  profitMarginBalance: number;
  active: boolean;
}

// Temporary User Financial Transaction
export interface TempUserTransaction {
  id: string;
  tempOrderId: string;
  subOrderId: string;
  customerName: string;
  amount: number;
  date: string; // ISO String
  type: 'invoice' | 'payment';
  accountType: 'cash' | 'bank';
  notes: string;
  createdAt: string; // ISO String
}
