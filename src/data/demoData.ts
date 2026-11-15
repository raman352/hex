import {
  ChatMessage,
  DemoOrder,
  DemoPolicy,
  DemoProduct,
  FaqCategory,
  FaqItem,
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../types';
import {
  TICKETS_STORAGE_KEY,
  generateUniqueTicketId,
  loadTicketsFromStorage,
  resetTicketsInStorage,
  saveTicketsToStorage,
} from '../utils/ticketStorage';
import {
  FAQS_STORAGE_KEY,
  loadFaqsFromStorage,
  resetFaqsInStorage,
  saveFaqsToStorage,
} from '../utils/knowledgeBaseStorage';

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    sku: 'TC-AUD-01',
    name: 'AeroSound Pro ANC Headphones',
    category: 'Audio',
    priceInr: 7999,
    warrantyMonths: 12,
    highlights: 'Hybrid 42dB ANC, 40-hour battery, Bluetooth 5.3 multipoint, USB-C fast charge (10 min = 5 hrs).',
  },
  {
    sku: 'TC-WRB-03',
    name: 'PulseWatch S3 Smartwatch',
    category: 'Wearables',
    priceInr: 5499,
    warrantyMonths: 12,
    highlights: '1.43-inch AMOLED display, IP68 water resistance, 7-day battery, Bluetooth calling, SpO2 & heart rate tracking.',
  },
  {
    sku: 'TC-PWR-100',
    name: 'VoltDock 100W GaN Charger',
    category: 'Power & Accessories',
    priceInr: 2899,
    warrantyMonths: 18,
    highlights: '3 USB-C PD 3.0 ports + 1 USB-A QC port, foldable prongs, built-in surge and thermal protection.',
  },
  {
    sku: 'TC-CAM-4K',
    name: 'ClearView 4K Webcam',
    category: 'Workstation',
    priceInr: 4599,
    warrantyMonths: 12,
    highlights: '4K UHD 30fps Sony sensor, dual noise-cancelling mics, auto low-light correction, magnetic privacy shutter.',
  },
];

export const DEMO_ORDERS: DemoOrder[] = [
  {
    orderId: 'TC-1041',
    customerName: 'Aarav Mehta',
    productName: 'AeroSound Pro ANC Headphones',
    orderDate: '2026-11-05',
    status: 'Delivered',
    estimatedDelivery: 'Delivered on 2026-11-08',
    trackingNumber: 'BD-88294011',
    carrier: 'BlueDart Express',
  },
  {
    orderId: 'TC-1042',
    customerName: 'Priya Sharma',
    productName: 'PulseWatch S3 Smartwatch',
    orderDate: '2026-11-11',
    status: 'In Transit',
    estimatedDelivery: '2026-11-16 (Arriving in 2 days)',
    trackingNumber: 'DL-49201833',
    carrier: 'Delhivery Air',
  },
  {
    orderId: 'TC-1043',
    customerName: 'Rohan Verma',
    productName: 'VoltDock 100W GaN Charger',
    orderDate: '2026-11-13',
    status: 'Processing',
    estimatedDelivery: '2026-11-18',
    trackingNumber: 'Pending dispatch',
    carrier: 'TechCare Fulfilment Hub',
  },
  {
    orderId: 'TC-1044',
    customerName: 'Sneha Nair',
    productName: 'ClearView 4K Webcam',
    orderDate: '2026-11-01',
    status: 'Return Requested',
    estimatedDelivery: 'Pickup scheduled for 2026-11-15',
    trackingNumber: 'RET-771029',
    carrier: 'BlueDart Reverse Logistics',
  },
];

export const DEMO_POLICIES: DemoPolicy[] = [
  {
    id: 'pol-return',
    title: 'Return Policy',
    summary: '14-day hassle-free return window for unused or defective electronics in original packaging.',
    details: [
      'Returns are accepted within 14 calendar days from the delivery date.',
      'Products must include the original box, accessories, manuals, and undamaged serial label.',
      'Damaged-on-arrival (DOA) or wrong items qualify for free doorstep reverse pickup within 48 hours of reporting.',
      'Opened accessories with physical user damage or missing parts are ineligible for standard returns.',
    ],
  },
  {
    id: 'pol-refund',
    title: 'Refund Policy',
    summary: 'Refunds are processed within 5–7 business days after quality inspection at our warehouse.',
    details: [
      'Once reverse pickup reaches the TechCare inspection hub, quality check completes within 48 hours.',
      'Approved refunds are credited to the original payment method within 5–7 business days.',
      'Store credit (TechCare Wallet) refunds are instant upon pickup verification.',
      'Never share bank passwords, OTPs, or full card numbers with any support agent.',
    ],
  },
  {
    id: 'pol-shipping',
    title: 'Shipping Information',
    summary: 'Free standard shipping on orders above ₹999; express 1–2 day delivery available in metro cities.',
    details: [
      'Standard shipping takes 3–5 business days across India and is free on orders over ₹999 (₹79 below ₹999).',
      'Express shipping (1–2 business days in metro cities) costs ₹149.',
      'Orders placed before 2:00 PM IST on weekdays are dispatched the same day.',
      'Tracking IDs are shared once the courier scans the parcel at our warehouse.',
    ],
  },
  {
    id: 'pol-warranty',
    title: 'Warranty Information',
    summary: '12-month standard manufacturer warranty (18 months on VoltDock GaN chargers).',
    details: [
      'Audio, Wearables, and Webcam products carry a 12-month warranty from the invoice date.',
      'VoltDock 100W GaN Charger carries an extended 18-month warranty.',
      'Covers manufacturing defects, battery failure (>20% premature degradation), and hardware malfunctions.',
      'Excludes liquid immersion beyond IP rating, physical drops/cracks, and unauthorized third-party repairs.',
    ],
  },
];

export const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'FAQ-001',
    category: FaqCategory.RETURNS,
    question: 'What is TechCare’s demonstration return window and condition requirement?',
    answer:
      'TechCare offers a 14-day return window from the date of delivery. The item must be in original condition with its box, charger/cables, manuals, and intact serial number. For defective or wrong items received, doorstep pickup is free.',
    updatedAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'FAQ-002',
    category: FaqCategory.REFUNDS,
    question: 'How long does it take to receive a refund after returning an item?',
    answer:
      'After the returned product reaches our inspection center, quality verification takes up to 48 hours. Once approved, refunds are issued to your original payment method within 5–7 business days (or instantly if you choose TechCare Store Credit).',
    updatedAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'FAQ-003',
    category: FaqCategory.SHIPPING,
    question: 'What are TechCare’s shipping timelines and delivery charges?',
    answer:
      'Standard delivery takes 3–5 business days across India and is free for orders above ₹999 (₹79 fee for smaller orders). Express 1–2 day metro delivery is available for ₹149. Weekday orders placed before 2:00 PM IST ship the same day.',
    updatedAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'FAQ-004',
    category: FaqCategory.WARRANTY,
    question: 'What does the TechCare manufacturer warranty cover?',
    answer:
      'Most TechCare products include a 12-month warranty (18 months for VoltDock 100W GaN Charger). It covers manufacturing defects, speaker/mic faults, charging circuit issues, and display malfunctions. Physical user damage, cracked screens, and unauthorized repairs are not covered.',
    updatedAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'FAQ-005',
    category: FaqCategory.DAMAGED,
    question: 'What should I do if my TechCare product arrives damaged or broken on delivery?',
    answer:
      'Please report a damaged-on-arrival (DOA) or wrong item within 48 hours of delivery with your Order ID. TechCare arranges a free doorstep reverse pickup within 48 hours and prioritizes either a brand-new replacement unit or a full refund after quick inspection.',
    updatedAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'FAQ-006',
    category: FaqCategory.ORDERS,
    question: 'How can I track my TechCare order?',
    answer:
      'Provide your Order ID (for example, TC-1042) in DeskPilot chat to check live dispatch and courier details. Orders in Processing state receive a courier tracking number as soon as they leave the TechCare Fulfilment Hub.',
    updatedAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'FAQ-007',
    category: FaqCategory.PRODUCTS,
    question: 'Does AeroSound Pro ANC support connecting to two devices at once?',
    answer:
      'Yes! AeroSound Pro ANC Headphones feature Bluetooth 5.3 multipoint pairing, allowing seamless switching between two devices such as a laptop and a smartphone, with up to 40 hours of battery life and USB-C fast charging (10 min = 5 hrs).',
    updatedAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'FAQ-008',
    category: FaqCategory.PRODUCTS,
    question: 'Is PulseWatch S3 water resistant, and what if the screen flickers or stops charging?',
    answer:
      'PulseWatch S3 has an IP68 rating (safe for rain, sweat, and handwashing, but not hot showers or diving). If your watch screen flickers or stops charging, try a hard restart and a certified USB charger. If the issue persists within warranty, raise a Warranty & Repair support ticket for pickup.',
    updatedAt: '2026-11-10T10:00:00Z',
  },
  {
    id: 'FAQ-009',
    category: FaqCategory.CANCELLATION,
    question: 'Can I cancel my TechCare order after placing it?',
    answer:
      'Orders in Processing status can be cancelled free of charge before courier dispatch for a full refund within 5–7 business days. Once an order is In Transit, it cannot be cancelled directly, but you can refuse delivery at the doorstep or request a return within 14 days after delivery.',
    updatedAt: '2026-11-10T10:00:00Z',
  },
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-2026-1001',
    customerName: 'Aarav Mehta',
    orderId: 'TC-1041',
    description: 'Left earcup ANC emits faint static noise when transparency mode is enabled.',
    category: TicketCategory.WARRANTY_REPAIR,
    priority: TicketPriority.HIGH,
    status: TicketStatus.OPEN,
    createdAt: '2026-11-12T09:30:00Z',
  },
  {
    id: 'TKT-2026-1002',
    customerName: 'Sneha Nair',
    orderId: 'TC-1044',
    description: 'ClearView 4K Webcam privacy shutter arrived loose; requested return pickup and refund.',
    category: TicketCategory.RETURNS_REFUNDS,
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.IN_PROGRESS,
    createdAt: '2026-11-13T14:15:00Z',
    adminNote: 'BlueDart reverse pickup scheduled for Nov 15.',
  },
  {
    id: 'TKT-2026-1003',
    customerName: 'Rohan Verma',
    orderId: 'TC-1043',
    description: 'Need invoice GST update and confirmation on express dispatch timeline for VoltDock 100W.',
    category: TicketCategory.ORDER_SHIPPING,
    priority: TicketPriority.LOW,
    status: TicketStatus.RESOLVED,
    createdAt: '2026-11-14T08:45:00Z',
    adminNote: 'Updated GST details on invoice and queued for afternoon dispatch.',
  },
  {
    id: 'TKT-2026-1004',
    customerName: 'Kavya Iyer',
    orderId: 'TC-1039',
    description: 'PulseWatch S3 battery drains from 100% to 10% within 4 hours even with AOD off.',
    category: TicketCategory.PRODUCT_DEFECT,
    priority: TicketPriority.URGENT,
    status: TicketStatus.OPEN,
    createdAt: '2026-11-14T16:20:00Z',
  },
];

export const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content:
    'Welcome to TechCare DeskPilot Support! I can help you with product specifications, order tracking (e.g., TC-1042), shipping timelines, returns, refunds, and warranty claims in English or Hinglish.\n\nHow can I assist you today?',
  timestamp: new Date().toISOString(),
};

export const SUGGESTED_QUESTIONS: string[] = [
  'What is TechCare’s return and refund policy?',
  'Mera order TC-1042 kab tak deliver hoga?',
  'What warranty does AeroSound Pro ANC have?',
  'My PulseWatch S3 screen is flickering — how do I get it fixed?',
];

const STORAGE_KEYS = {
  TICKETS: TICKETS_STORAGE_KEY,
  FAQS: FAQS_STORAGE_KEY,
  CHAT: 'techcare_deskpilot_chat_v1',
};

export function loadTickets(): SupportTicket[] {
  return loadTicketsFromStorage(INITIAL_TICKETS);
}

export function saveTickets(tickets: SupportTicket[]): void {
  saveTicketsToStorage(tickets);
}

export function loadFaqs(): FaqItem[] {
  return loadFaqsFromStorage(INITIAL_FAQS);
}

export function saveFaqs(faqs: FaqItem[]): void {
  saveFaqsToStorage(faqs);
}

export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (!raw) {
      const initial = [INITIAL_WELCOME_MESSAGE];
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [INITIAL_WELCOME_MESSAGE];
  } catch {
    return [INITIAL_WELCOME_MESSAGE];
  }
}

export function saveChatHistory(messages: ChatMessage[]): void {
  localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
}

export function resetAllDemoData(): {
  tickets: SupportTicket[];
  faqs: FaqItem[];
  messages: ChatMessage[];
} {
  const freshWelcome: ChatMessage = {
    ...INITIAL_WELCOME_MESSAGE,
    timestamp: new Date().toISOString(),
  };
  const tickets = resetTicketsInStorage(INITIAL_TICKETS);
  const faqs = resetFaqsInStorage(INITIAL_FAQS);
  saveChatHistory([freshWelcome]);
  return {
    tickets,
    faqs,
    messages: [freshWelcome],
  };
}

export function generateTicketId(existingTickets: SupportTicket[]): string {
  return generateUniqueTicketId(existingTickets);
}
