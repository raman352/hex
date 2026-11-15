import {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../types';

export const TICKETS_STORAGE_KEY = 'techcare_deskpilot_tickets_v1';

export interface CreateTicketInput {
  userId?: string;
  customerEmail?: string;
  customerName: string;
  orderId: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  sourceMessageId?: string;
}

export type CreateTicketResult =
  | {
      ok: true;
      ticket: SupportTicket;
      tickets: SupportTicket[];
    }
  | {
      ok: false;
      reason: 'validation' | 'duplicate';
      error: string;
      duplicateTicket?: SupportTicket;
      tickets: SupportTicket[];
    };

const VALID_STATUSES = new Set<string>(Object.values(TicketStatus));
const VALID_PRIORITIES = new Set<string>(Object.values(TicketPriority));
const VALID_CATEGORIES = new Set<string>(Object.values(TicketCategory));

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeTicketStatus(value: unknown): TicketStatus {
  if (typeof value === 'string' && VALID_STATUSES.has(value)) {
    return value as TicketStatus;
  }
  return TicketStatus.OPEN;
}

export function normalizeTicketPriority(value: unknown): TicketPriority {
  if (typeof value === 'string' && VALID_PRIORITIES.has(value)) {
    return value as TicketPriority;
  }
  return TicketPriority.MEDIUM;
}

export function normalizeTicketCategory(value: unknown): TicketCategory {
  if (typeof value === 'string' && VALID_CATEGORIES.has(value)) {
    return value as TicketCategory;
  }
  return TicketCategory.GENERAL;
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
}

/**
 * Validates and sanitizes an unknown record loaded from localStorage.
 * Returns null if mandatory fields (id, customerName, description) are missing or invalid.
 */
export function sanitizeStoredTicket(raw: unknown): SupportTicket | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  const customerName =
    typeof record.customerName === 'string' ? record.customerName.trim() : '';
  const description =
    typeof record.description === 'string' ? record.description.trim() : '';

  if (!id || !customerName || !description) {
    return null;
  }

  const orderId =
    typeof record.orderId === 'string' && record.orderId.trim()
      ? record.orderId.trim()
      : 'N/A';

  const ticket: SupportTicket = {
    id,
    customerName,
    orderId,
    description,
    category: normalizeTicketCategory(record.category),
    priority: normalizeTicketPriority(record.priority),
    status: normalizeTicketStatus(record.status),
    createdAt: isValidIsoDate(record.createdAt)
      ? record.createdAt
      : new Date().toISOString(),
  };

  if (typeof record.userId === 'string' && record.userId.trim()) {
    ticket.userId = record.userId.trim();
  }
  if (typeof record.customerEmail === 'string' && record.customerEmail.trim()) {
    ticket.customerEmail = record.customerEmail.trim();
  }
  if (isValidIsoDate(record.updatedAt)) {
    ticket.updatedAt = record.updatedAt;
  }
  if (typeof record.adminNote === 'string' && record.adminNote.trim()) {
    ticket.adminNote = record.adminNote.trim();
  }
  if (typeof record.sourceMessageId === 'string' && record.sourceMessageId.trim()) {
    ticket.sourceMessageId = record.sourceMessageId.trim();
  }

  return ticket;
}

/**
 * Safely saves the ticket list to browser localStorage.
 */
export function saveTicketsToStorage(tickets: SupportTicket[]): boolean {
  try {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads tickets from localStorage, sanitizing malformed items and recovering
 * cleanly with fallback seed tickets when stored data is missing or corrupt.
 */
export function loadTicketsFromStorage(
  fallbackTickets: SupportTicket[] = []
): SupportTicket[] {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (!raw) {
      saveTicketsToStorage(fallbackTickets);
      return [...fallbackTickets];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      saveTicketsToStorage(fallbackTickets);
      return [...fallbackTickets];
    }

    if (parsed.length === 0) {
      return [];
    }

    const seenIds = new Set<string>();
    const sanitized: SupportTicket[] = [];
    let hadInvalidItems = false;

    for (const item of parsed) {
      const clean = sanitizeStoredTicket(item);
      if (!clean || seenIds.has(clean.id)) {
        hadInvalidItems = true;
        continue;
      }
      seenIds.add(clean.id);
      sanitized.push(clean);
    }

    // If every single stored entry was corrupt, recover safely with fallback tickets
    if (sanitized.length === 0) {
      saveTicketsToStorage(fallbackTickets);
      return [...fallbackTickets];
    }

    // Re-save cleaned list if corrupt/duplicate items were stripped
    if (hadInvalidItems) {
      saveTicketsToStorage(sanitized);
    }

    return sanitized;
  } catch {
    saveTicketsToStorage(fallbackTickets);
    return [...fallbackTickets];
  }
}

/**
 * Generates a unique sequential ticket ID guaranteed not to collide with existing tickets.
 */
export function generateUniqueTicketId(existingTickets: SupportTicket[]): string {
  const existingIds = new Set(existingTickets.map((t) => t.id));
  const year = new Date().getFullYear();

  const maxNum = existingTickets.reduce((max, t) => {
    const match = t.id.match(/TKT-\d{4}-(\d+)/);
    const num = match ? parseInt(match[1], 10) : 1000;
    return num > max ? num : max;
  }, 1000);

  let nextNum = maxNum + 1;
  let candidate = `TKT-${year}-${nextNum}`;
  while (existingIds.has(candidate)) {
    nextNum += 1;
    candidate = `TKT-${year}-${nextNum}`;
  }
  return candidate;
}

/**
 * Checks whether an equivalent active ticket or message-linked ticket already exists.
 */
export function findDuplicateTicket(
  existingTickets: SupportTicket[],
  input: Pick<CreateTicketInput, 'customerName' | 'orderId' | 'description' | 'sourceMessageId'>
): SupportTicket | undefined {
  if (input.sourceMessageId && input.sourceMessageId !== 'manual') {
    const byMessage = existingTickets.find(
      (t) => t.sourceMessageId === input.sourceMessageId
    );
    if (byMessage) return byMessage;
  }

  const targetName = normalizeText(input.customerName);
  const targetOrder = normalizeText(input.orderId || 'N/A');
  const targetDesc = normalizeText(input.description);

  return existingTickets.find(
    (t) =>
      t.status !== TicketStatus.RESOLVED &&
      normalizeText(t.customerName) === targetName &&
      normalizeText(t.orderId || 'N/A') === targetOrder &&
      normalizeText(t.description) === targetDesc
  );
}

/**
 * Creates a new ticket in localStorage while enforcing validation, unique IDs,
 * and duplicate submission prevention.
 */
export function createTicketInStorage(
  input: CreateTicketInput,
  fallbackTickets: SupportTicket[] = []
): CreateTicketResult {
  const currentTickets = loadTicketsFromStorage(fallbackTickets);

  const cleanName = input.customerName.trim();
  const cleanOrderId = input.orderId.trim() || 'N/A';
  const cleanDescription = input.description.trim();

  if (!cleanName) {
    return {
      ok: false,
      reason: 'validation',
      error: 'Please enter the customer name.',
      tickets: currentTickets,
    };
  }

  if (cleanDescription.length < 8) {
    return {
      ok: false,
      reason: 'validation',
      error: 'Please provide a clear complaint description (at least 8 characters).',
      tickets: currentTickets,
    };
  }

  const duplicate = findDuplicateTicket(currentTickets, {
    customerName: cleanName,
    orderId: cleanOrderId,
    description: cleanDescription,
    sourceMessageId: input.sourceMessageId,
  });

  if (duplicate) {
    return {
      ok: false,
      reason: 'duplicate',
      error: `A matching active ticket (${duplicate.id}) has already been recorded for this request.`,
      duplicateTicket: duplicate,
      tickets: currentTickets,
    };
  }

  const nowIso = new Date().toISOString();
  const newTicket: SupportTicket = {
    id: generateUniqueTicketId(currentTickets),
    customerName: cleanName,
    orderId: cleanOrderId,
    description: cleanDescription,
    category: normalizeTicketCategory(input.category),
    priority: normalizeTicketPriority(input.priority),
    status: TicketStatus.OPEN,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  if (input.userId?.trim()) {
    newTicket.userId = input.userId.trim();
  }
  if (input.customerEmail?.trim()) {
    newTicket.customerEmail = input.customerEmail.trim();
  }
  if (input.sourceMessageId && input.sourceMessageId !== 'manual') {
    newTicket.sourceMessageId = input.sourceMessageId;
  }

  const nextTickets = [newTicket, ...currentTickets];
  saveTicketsToStorage(nextTickets);

  return {
    ok: true,
    ticket: newTicket,
    tickets: nextTickets,
  };
}

/**
 * Updates an existing ticket's status, priority, or admin resolution note in localStorage.
 */
export function updateTicketInStorage(
  ticketId: string,
  updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'adminNote'>>,
  fallbackTickets: SupportTicket[] = []
): SupportTicket[] {
  const currentTickets = loadTicketsFromStorage(fallbackTickets);
  const nextTickets = currentTickets.map((ticket) => {
    if (ticket.id !== ticketId) return ticket;
    const updated: SupportTicket = {
      ...ticket,
      updatedAt: new Date().toISOString(),
    };
    if (updates.status !== undefined) {
      updated.status = normalizeTicketStatus(updates.status);
    }
    if (updates.priority !== undefined) {
      updated.priority = normalizeTicketPriority(updates.priority);
    }
    if (updates.adminNote !== undefined) {
      const trimmedNote = updates.adminNote.trim();
      if (trimmedNote) {
        updated.adminNote = trimmedNote;
      } else {
        delete updated.adminNote;
      }
    }
    return updated;
  });

  saveTicketsToStorage(nextTickets);
  return nextTickets;
}

/**
 * Deletes a ticket from localStorage by ID.
 */
export function deleteTicketInStorage(
  ticketId: string,
  fallbackTickets: SupportTicket[] = []
): SupportTicket[] {
  const currentTickets = loadTicketsFromStorage(fallbackTickets);
  const nextTickets = currentTickets.filter((t) => t.id !== ticketId);
  saveTicketsToStorage(nextTickets);
  return nextTickets;
}

/**
 * Restores stored tickets to the provided initial seed list.
 */
export function resetTicketsInStorage(
  seedTickets: SupportTicket[]
): SupportTicket[] {
  const copy = [...seedTickets];
  saveTicketsToStorage(copy);
  return copy;
}
