export enum TicketStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export enum TicketCategory {
  ORDER_SHIPPING = 'Order & Shipping',
  RETURNS_REFUNDS = 'Returns & Refunds',
  WARRANTY_REPAIR = 'Warranty & Repair',
  PRODUCT_DEFECT = 'Product Defect',
  PRODUCT_INFO = 'Product Inquiry',
  GENERAL = 'General Support',
}

export enum FaqCategory {
  RETURNS = 'Returns',
  REFUNDS = 'Refunds',
  SHIPPING = 'Shipping',
  WARRANTY = 'Warranty',
  DAMAGED = 'Damaged Products',
  ORDERS = 'Order Tracking',
  PRODUCTS = 'Product Support',
  CANCELLATION = 'Cancellation',
}

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isDemo?: boolean;
}

export interface SupportTicket {
  id: string;
  userId?: string;
  customerEmail?: string;
  customerName: string;
  orderId: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt?: string;
  adminNote?: string;
  sourceMessageId?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  updatedAt: string;
}

export interface DemoProduct {
  sku: string;
  name: string;
  category: string;
  priceInr: number;
  warrantyMonths: number;
  highlights: string;
}

export interface DemoOrder {
  orderId: string;
  customerName: string;
  productName: string;
  orderDate: string;
  status: 'Delivered' | 'In Transit' | 'Processing' | 'Return Requested';
  estimatedDelivery: string;
  trackingNumber: string;
  carrier: string;
}

export interface DemoPolicy {
  id: string;
  title: string;
  summary: string;
  details: string[];
}

export interface SuggestedTicketDraft {
  customerName?: string;
  orderId?: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestTicketCreation?: boolean;
  suggestedTicket?: SuggestedTicketDraft;
  ticketCreatedId?: string;
  isError?: boolean;
}

export type ActiveView = 'chat' | 'tickets' | 'admin' | 'knowledge' | 'demo';
