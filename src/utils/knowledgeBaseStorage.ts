import { FaqCategory, FaqItem } from '../types';

export const FAQS_STORAGE_KEY = 'techcare_deskpilot_faqs_v1';

export interface FaqInput {
  question: string;
  answer: string;
  category: FaqCategory;
}

export type AddFaqResult =
  | {
      ok: true;
      faq: FaqItem;
      faqs: FaqItem[];
    }
  | {
      ok: false;
      error: string;
      faqs: FaqItem[];
    };

const VALID_CATEGORIES = new Set<string>(Object.values(FaqCategory));

const LEGACY_CATEGORY_MAP: Record<string, FaqCategory> = {
  'Return Policy': FaqCategory.RETURNS,
  'Refund Policy': FaqCategory.REFUNDS,
  'Product Info': FaqCategory.PRODUCTS,
};

export function normalizeFaqCategory(value: unknown): FaqCategory {
  if (typeof value === 'string') {
    if (VALID_CATEGORIES.has(value)) {
      return value as FaqCategory;
    }
    if (value in LEGACY_CATEGORY_MAP) {
      return LEGACY_CATEGORY_MAP[value];
    }
  }
  return FaqCategory.PRODUCTS;
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !Number.isNaN(Date.parse(value));
}

export function sanitizeStoredFaq(raw: unknown): FaqItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  const question = typeof record.question === 'string' ? record.question.trim() : '';
  const answer = typeof record.answer === 'string' ? record.answer.trim() : '';

  if (!id || !question || !answer) {
    return null;
  }

  return {
    id,
    question,
    answer,
    category: normalizeFaqCategory(record.category),
    updatedAt: isValidIsoDate(record.updatedAt)
      ? record.updatedAt
      : new Date().toISOString(),
  };
}

export function saveFaqsToStorage(faqs: FaqItem[]): boolean {
  try {
    localStorage.setItem(FAQS_STORAGE_KEY, JSON.stringify(faqs));
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads FAQs from localStorage without resetting existing user-edited entries.
 * Seeds fallbackFaqs only when stored data is missing or completely corrupt.
 */
export function loadFaqsFromStorage(fallbackFaqs: FaqItem[] = []): FaqItem[] {
  try {
    const raw = localStorage.getItem(FAQS_STORAGE_KEY);
    if (!raw) {
      saveFaqsToStorage(fallbackFaqs);
      return [...fallbackFaqs];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      saveFaqsToStorage(fallbackFaqs);
      return [...fallbackFaqs];
    }

    if (parsed.length === 0) {
      return [];
    }

    const seenIds = new Set<string>();
    const sanitized: FaqItem[] = [];
    let hadModifications = false;

    for (const item of parsed) {
      const clean = sanitizeStoredFaq(item);
      if (!clean || seenIds.has(clean.id)) {
        hadModifications = true;
        continue;
      }
      if (
        typeof item === 'object' &&
        item !== null &&
        (item as Record<string, unknown>).category !== clean.category
      ) {
        hadModifications = true;
      }
      seenIds.add(clean.id);
      sanitized.push(clean);
    }

    if (sanitized.length === 0) {
      saveFaqsToStorage(fallbackFaqs);
      return [...fallbackFaqs];
    }

    if (hadModifications) {
      saveFaqsToStorage(sanitized);
    }

    return sanitized;
  } catch {
    saveFaqsToStorage(fallbackFaqs);
    return [...fallbackFaqs];
  }
}

export function generateUniqueFaqId(existingFaqs: FaqItem[]): string {
  const existingIds = new Set(existingFaqs.map((f) => f.id));
  const maxNum = existingFaqs.reduce((max, f) => {
    const match = f.id.match(/(?:FAQ|faq)-(\d+)/);
    const num = match ? parseInt(match[1], 10) : 0;
    return num > max ? num : max;
  }, 0);

  let nextNum = Math.max(maxNum + 1, 1);
  let candidate = `FAQ-${String(nextNum).padStart(3, '0')}`;
  while (existingIds.has(candidate) || existingIds.has(`faq-${nextNum}`)) {
    nextNum += 1;
    candidate = `FAQ-${String(nextNum).padStart(3, '0')}`;
  }
  return candidate;
}

export function addFaqInStorage(
  input: FaqInput,
  fallbackFaqs: FaqItem[] = []
): AddFaqResult {
  const currentFaqs = loadFaqsFromStorage(fallbackFaqs);
  const cleanQuestion = input.question.trim();
  const cleanAnswer = input.answer.trim();

  if (cleanQuestion.length < 5) {
    return {
      ok: false,
      error: 'Please enter a clear FAQ question (at least 5 characters).',
      faqs: currentFaqs,
    };
  }
  if (cleanAnswer.length < 10) {
    return {
      ok: false,
      error: 'Please enter a helpful answer (at least 10 characters).',
      faqs: currentFaqs,
    };
  }

  const normalizedQ = cleanQuestion.toLowerCase();
  if (currentFaqs.some((f) => f.question.trim().toLowerCase() === normalizedQ)) {
    return {
      ok: false,
      error: 'An FAQ with this exact question already exists in the Knowledge Base.',
      faqs: currentFaqs,
    };
  }

  const newFaq: FaqItem = {
    id: generateUniqueFaqId(currentFaqs),
    question: cleanQuestion,
    answer: cleanAnswer,
    category: normalizeFaqCategory(input.category),
    updatedAt: new Date().toISOString(),
  };

  const nextFaqs = [newFaq, ...currentFaqs];
  saveFaqsToStorage(nextFaqs);
  return {
    ok: true,
    faq: newFaq,
    faqs: nextFaqs,
  };
}

export function updateFaqInStorage(
  faqId: string,
  updates: FaqInput,
  fallbackFaqs: FaqItem[] = []
): FaqItem[] {
  const currentFaqs = loadFaqsFromStorage(fallbackFaqs);
  const nowIso = new Date().toISOString();

  const nextFaqs = currentFaqs.map((faq) => {
    if (faq.id !== faqId) return faq;
    return {
      ...faq,
      question: updates.question.trim(),
      answer: updates.answer.trim(),
      category: normalizeFaqCategory(updates.category),
      updatedAt: nowIso,
    };
  });

  saveFaqsToStorage(nextFaqs);
  return nextFaqs;
}

export function deleteFaqInStorage(
  faqId: string,
  fallbackFaqs: FaqItem[] = []
): FaqItem[] {
  const currentFaqs = loadFaqsFromStorage(fallbackFaqs);
  const nextFaqs = currentFaqs.filter((faq) => faq.id !== faqId);
  saveFaqsToStorage(nextFaqs);
  return nextFaqs;
}

export function resetFaqsInStorage(seedFaqs: FaqItem[]): FaqItem[] {
  const copy = [...seedFaqs];
  saveFaqsToStorage(copy);
  return copy;
}

/**
 * Selects and orders the most relevant FAQs for a customer chat query while
 * keeping all active FAQs available up to maxCount so synonym/Hinglish queries match reliably.
 */
export function selectRelevantFaqs(
  faqs: FaqItem[],
  queryText: string,
  maxCount = 30
): FaqItem[] {
  if (faqs.length <= maxCount && !queryText.trim()) {
    return faqs;
  }

  const tokens = queryText
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);

  if (tokens.length === 0) {
    return faqs.slice(0, maxCount);
  }

  const scored = faqs.map((faq, index) => {
    const haystack = `${faq.category} ${faq.question} ${faq.answer}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += faq.question.toLowerCase().includes(token) ? 3 : 1;
      }
    }
    return { faq, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, maxCount).map((entry) => entry.faq);
}
