import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Headphones, Loader2, X } from 'lucide-react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuthLandingPage } from './components/AuthLandingPage';
import { CustomerChatView } from './components/CustomerChatView';
import { CustomerTicketsView } from './components/CustomerTicketsView';
import { DemoDataGuideView } from './components/DemoDataGuideView';
import { FaqActionResult, KnowledgeBaseView } from './components/KnowledgeBaseView';
import { TicketModal, TicketSubmitResult } from './components/TicketModal';
import { TopNav } from './components/TopNav';
import {
  DEMO_ORDERS,
  DEMO_PRODUCTS,
  INITIAL_FAQS,
  INITIAL_TICKETS,
  INITIAL_WELCOME_MESSAGE,
  loadChatHistory,
  resetAllDemoData,
  saveChatHistory,
} from './data/demoData';
import {
  TICKETS_STORAGE_KEY,
  createTicketInStorage,
  deleteTicketInStorage,
  loadTicketsFromStorage,
  updateTicketInStorage,
} from './utils/ticketStorage';
import {
  FAQS_STORAGE_KEY,
  addFaqInStorage,
  deleteFaqInStorage,
  loadFaqsFromStorage,
  selectRelevantFaqs,
  updateFaqInStorage,
} from './utils/knowledgeBaseStorage';
import {
  ActiveView,
  AuthUser,
  ChatMessage,
  FaqItem,
  SuggestedTicketDraft,
  SupportTicket,
  TicketCategory,
  TicketPriority,
  UserRole,
} from './types';

function normalizeCategory(val?: string): TicketCategory {
  const valid = Object.values(TicketCategory);
  if (val && valid.includes(val as TicketCategory)) {
    return val as TicketCategory;
  }
  return TicketCategory.GENERAL;
}

function normalizePriority(val?: string): TicketPriority {
  const valid = Object.values(TicketPriority);
  if (val && valid.includes(val as TicketPriority)) {
    return val as TicketPriority;
  }
  return TicketPriority.MEDIUM;
}

function extractOrderIdFromConversation(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const match = messages[i].content.match(/\b(TC-\d{3,6})\b/i);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return '';
}

function summarizeConversationForTicket(
  messages: ChatMessage[],
  upToMessageId?: string | null
): string {
  let slice = messages;
  if (upToMessageId && upToMessageId !== 'manual') {
    const idx = messages.findIndex((m) => m.id === upToMessageId);
    if (idx >= 0) {
      slice = messages.slice(0, idx + 1);
    }
  }
  const userMessages = slice
    .filter((m) => m.role === 'user' && !m.isError && m.content.trim().length > 0)
    .slice(-3)
    .map((m) => m.content.trim());

  return userMessages.join(' | ');
}

const SESSION_TOKEN_KEY = 'techcare_deskpilot_session_token_v1';

function getStoredSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveStoredSessionToken(token?: string): void {
  try {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    }
  } catch {
    // Ignore storage quota errors
  }
}

function clearStoredSessionToken(): void {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra ?? {}) };
  const token = getStoredSessionToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    loadTicketsFromStorage(INITIAL_TICKETS)
  );
  const [faqs, setFaqs] = useState<FaqItem[]>(() => loadFaqsFromStorage(INITIAL_FAQS));
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory());

  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastUserText, setLastUserText] = useState<string | null>(null);
  const chatRequestInFlightRef = useRef(false);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketDraft, setTicketDraft] = useState<SuggestedTicketDraft | null>(null);
  const [sourceMessageId, setSourceMessageId] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    actionLabel?: string;
    targetView?: ActiveView;
  } | null>(null);

  // Check active server-side demo session on initial mount
  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', {
      credentials: 'include',
      headers: buildAuthHeaders(),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && data?.user) {
          const user = data.user as AuthUser;
          setCurrentUser(user);
          setActiveView(user.role === UserRole.ADMIN ? 'admin' : 'chat');
        } else if (res.status === 401) {
          clearStoredSessionToken();
        }
      })
      .catch(() => {
        // Unauthenticated fallback handled gracefully
      })
      .finally(() => {
        if (active) setIsCheckingAuth(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TICKETS_STORAGE_KEY) {
        setTickets(loadTicketsFromStorage(INITIAL_TICKETS));
      } else if (e.key === FAQS_STORAGE_KEY) {
        setFaqs(loadFaqsFromStorage(INITIAL_FAQS));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  const showToast = (
    message: string,
    actionLabel?: string,
    targetView?: ActiveView
  ) => {
    setToast({ message, actionLabel, targetView });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Customers only view their own tickets; Admins view all tickets
  const customerScopedTickets = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMIN) return tickets;
    return tickets.filter(
      (t) =>
        t.userId === currentUser.id ||
        (t.customerEmail &&
          t.customerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser.isDemo &&
          t.customerName.toLowerCase() === currentUser.fullName.toLowerCase())
    );
  }, [tickets, currentUser]);

  const handleAuthSuccess = (user: AuthUser, sessionToken?: string) => {
    if (sessionToken) {
      saveStoredSessionToken(sessionToken);
    }
    setTickets(loadTicketsFromStorage(INITIAL_TICKETS));
    setFaqs(loadFaqsFromStorage(INITIAL_FAQS));
    setCurrentUser(user);
    setSessionNotice(null);
    setChatError(null);
    setActiveView(user.role === UserRole.ADMIN ? 'admin' : 'chat');
    showToast(
      `Entered ${user.role === UserRole.ADMIN ? 'Admin Demo' : 'Customer Demo'} as ${user.fullName}.`
    );
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders(),
      });
    } catch {
      // Clear local UI state regardless
    }
    clearStoredSessionToken();
    setCurrentUser(null);
    setSessionNotice(null);
    setChatError(null);
    setIsTicketModalOpen(false);
  };

  const syncDemoRole = (portal: 'customer' | 'admin', demoName?: string) => {
    fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ portal, demoName }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.user) {
          if (data.sessionToken) {
            saveStoredSessionToken(data.sessionToken);
          }
          setCurrentUser(data.user as AuthUser);
        }
      })
      .catch(() => {
        // Local demo state remains active
      });
  };

  const handleNavigate = (view: ActiveView) => {
    if (!currentUser) return;
    if (
      currentUser.role !== UserRole.ADMIN &&
      (view === 'admin' || view === 'knowledge')
    ) {
      setCurrentUser({
        id: 'usr-demo-admin',
        fullName: 'TechCare Admin (Demo)',
        email: 'admin.demo@techcare.example',
        role: UserRole.ADMIN,
        isDemo: true,
      });
      syncDemoRole('admin');
      showToast('Switched to Admin Demo mode.');
    }
    if (view === 'admin' || view === 'tickets') {
      setTickets(loadTicketsFromStorage(INITIAL_TICKETS));
    }
    if (view === 'knowledge' || view === 'chat') {
      setFaqs(loadFaqsFromStorage(INITIAL_FAQS));
    }
    setActiveView(view);
  };

  const requestAiReply = async (historyForApi: ChatMessage[]) => {
    if (chatRequestInFlightRef.current) return;
    chatRequestInFlightRef.current = true;
    setIsChatLoading(true);
    setChatError(null);

    try {
      const latestFaqs = loadFaqsFromStorage(INITIAL_FAQS);
      setFaqs(latestFaqs);
      const latestUserQuery =
        [...historyForApi].reverse().find((m) => m.role === 'user')?.content ?? '';
      const relevantFaqs = selectRelevantFaqs(latestFaqs, latestUserQuery);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          messages: historyForApi
            .filter((m) => !m.isError)
            .map((m) => ({ role: m.role, content: m.content })),
          knowledgeBase: relevantFaqs,
          products: DEMO_PRODUCTS,
          orders: DEMO_ORDERS,
        }),
      });

      const data = await response.json();

      if (response.status === 401 && data?.code === 'SESSION_EXPIRED') {
        clearStoredSessionToken();
        setCurrentUser(null);
        setSessionNotice('Your session expired. Please sign in again.');
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to reach TechCare AI Support. Please try again.'
        );
      }

      const offerTicket = Boolean(data.offerTicket);
      const fallbackSummary = summarizeConversationForTicket(historyForApi);
      const detectedOrderId =
        typeof data.suggestedOrderId === 'string' && data.suggestedOrderId.trim()
          ? data.suggestedOrderId.trim()
          : extractOrderIdFromConversation(historyForApi);
      const cleanedDraft: SuggestedTicketDraft | undefined = offerTicket
        ? {
            customerName: currentUser?.fullName || '',
            orderId: detectedOrderId,
            description:
              typeof data.ticketSummary === 'string' && data.ticketSummary.trim()
                ? data.ticketSummary.trim()
                : fallbackSummary || lastUserText || '',
            category: normalizeCategory(data.category),
            priority: normalizePriority(data.priority),
          }
        : undefined;

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: typeof data.answer === 'string' ? data.answer : '',
        timestamp: new Date().toISOString(),
        suggestTicketCreation: offerTicket,
        suggestedTicket: cleanedDraft,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errText =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while contacting support.';
      setChatError(errText);
    } finally {
      chatRequestInFlightRef.current = false;
      setIsChatLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatRequestInFlightRef.current || isChatLoading) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLastUserText(trimmed);
    await requestAiReply(nextHistory);
  };

  const handleRetryLast = async () => {
    if (chatRequestInFlightRef.current || isChatLoading) return;
    if (!lastUserText && messages.length === 0) return;
    await requestAiReply(messages);
  };

  const handleClearChat = () => {
    const freshWelcome: ChatMessage = {
      ...INITIAL_WELCOME_MESSAGE,
      id: `msg-welcome-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setMessages([freshWelcome]);
    setChatError(null);
    setLastUserText(null);
  };

  const handleOpenNewTicketModal = (
    msgId: string | null = null,
    draft: SuggestedTicketDraft | null = null
  ) => {
    const conversationSummary = summarizeConversationForTicket(messages, msgId);
    const conversationOrderId = extractOrderIdFromConversation(messages);
    const shouldPrefillFromConversation =
      Boolean(draft) || msgId === 'manual' || (activeView === 'chat' && Boolean(conversationSummary));

    const resolvedDraft: SuggestedTicketDraft | null = draft
      ? {
          ...draft,
          customerName: draft.customerName || currentUser?.fullName || '',
          orderId: draft.orderId || conversationOrderId,
          description: draft.description?.trim() || conversationSummary,
        }
      : shouldPrefillFromConversation
        ? {
            customerName: currentUser?.fullName || '',
            orderId: conversationOrderId,
            description: conversationSummary,
            category: TicketCategory.GENERAL,
            priority: TicketPriority.MEDIUM,
          }
        : null;

    setSourceMessageId(msgId);
    setTicketDraft(resolvedDraft);
    setIsTicketModalOpen(true);
  };

  const handleCreateTicket = (ticketData: {
    customerName: string;
    orderId: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
  }): TicketSubmitResult => {
    if (!currentUser) {
      return { ok: false, error: 'Please sign in before creating a support ticket.' };
    }

    const result = createTicketInStorage(
      {
        userId: currentUser.id,
        customerEmail: currentUser.email,
        customerName: ticketData.customerName,
        orderId: ticketData.orderId,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        sourceMessageId: sourceMessageId ?? undefined,
      },
      INITIAL_TICKETS
    );

    setTickets(result.tickets);

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const newTicket = result.ticket;

    if (sourceMessageId && sourceMessageId !== 'manual') {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === sourceMessageId ? { ...m, ticketCreatedId: newTicket.id } : m
        )
      );
    }

    if (currentUser.role === UserRole.ADMIN) {
      showToast(`Ticket ${newTicket.id} recorded.`, 'View in Admin Desk', 'admin');
    } else {
      showToast(`Ticket ${newTicket.id} recorded.`, 'View My Tickets', 'tickets');
    }

    return { ok: true, ticket: newTicket };
  };

  const handleUpdateTicket = (
    ticketId: string,
    updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'adminNote'>>
  ) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    const updatedTickets = updateTicketInStorage(ticketId, updates, INITIAL_TICKETS);
    setTickets(updatedTickets);
    showToast(`Updated ${ticketId} and saved changes.`);
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    const updatedTickets = deleteTicketInStorage(ticketId, INITIAL_TICKETS);
    setTickets(updatedTickets);
    showToast(`Deleted ticket ${ticketId}.`);
  };

  const handleAddFaq = (faqInput: Omit<FaqItem, 'id' | 'updatedAt'>): FaqActionResult => {
    if (currentUser?.role !== UserRole.ADMIN) {
      return { ok: false, error: 'Administrator privileges are required.' };
    }
    const result = addFaqInStorage(faqInput, INITIAL_FAQS);
    setFaqs(result.faqs);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    showToast(`FAQ ${result.faq.id} published and synced with DeskPilot AI.`);
    return { ok: true };
  };

  const handleUpdateFaq = (
    id: string,
    updates: Omit<FaqItem, 'id' | 'updatedAt'>
  ): FaqActionResult => {
    if (currentUser?.role !== UserRole.ADMIN) {
      return { ok: false, error: 'Administrator privileges are required.' };
    }
    if (updates.question.trim().length < 5 || updates.answer.trim().length < 10) {
      return { ok: false, error: 'Please provide a valid question and answer.' };
    }
    const updatedFaqs = updateFaqInStorage(id, updates, INITIAL_FAQS);
    setFaqs(updatedFaqs);
    showToast(`FAQ ${id} updated and synced with DeskPilot AI.`);
    return { ok: true };
  };

  const handleDeleteFaq = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    const updatedFaqs = deleteFaqInStorage(id, INITIAL_FAQS);
    setFaqs(updatedFaqs);
    showToast(`FAQ ${id} removed from Knowledge Base.`);
  };

  const handleResetDemoData = () => {
    const restored = resetAllDemoData();
    setTickets(restored.tickets);
    setFaqs(restored.faqs);
    setMessages(restored.messages);
    setChatError(null);
  };

  // Loading state while verifying session cookie
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#E9F0F7] flex items-center justify-center p-4">
        <div className="neu-surface rounded-3xl p-8 flex flex-col items-center gap-3 text-center">
          <span className="neu-btn-primary w-12 h-12 rounded-2xl flex items-center justify-center">
            <Headphones className="w-6 h-6" aria-hidden="true" />
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#29384A]">
            <Loader2 className="w-4 h-4 animate-spin text-[#548BCB]" aria-hidden="true" />
            <span>Loading TechCare DeskPilot...</span>
          </div>
        </div>
      </div>
    );
  }

  // Demo Access gate: show Demo Access Page first
  if (!currentUser) {
    return (
      <AuthLandingPage
        sessionNotice={sessionNotice}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen flex flex-col bg-[#E9F0F7] text-[#29384A]">
      <TopNav
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenNewTicket={() => handleOpenNewTicketModal(null, null)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'chat' && (
          <CustomerChatView
            messages={messages}
            customerName={currentUser.role === UserRole.CUSTOMER ? currentUser.fullName : undefined}
            isLoading={isChatLoading}
            errorMsg={chatError}
            onSendMessage={handleSendMessage}
            onRetryLast={handleRetryLast}
            onClearChat={handleClearChat}
            onCreateTicketFromMessage={(msgId, draft) =>
              handleOpenNewTicketModal(msgId, draft ?? null)
            }
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'tickets' && (
          <CustomerTicketsView
            tickets={customerScopedTickets}
            isAdmin={isAdmin}
            onOpenNewTicket={() => handleOpenNewTicketModal(null, null)}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboardView
            tickets={tickets}
            onUpdateTicket={handleUpdateTicket}
            onDeleteTicket={handleDeleteTicket}
            onOpenKnowledgeBase={() => handleNavigate('knowledge')}
          />
        )}

        {activeView === 'knowledge' && (
          <KnowledgeBaseView
            faqs={faqs}
            onAddFaq={handleAddFaq}
            onUpdateFaq={handleUpdateFaq}
            onDeleteFaq={handleDeleteFaq}
          />
        )}

        {activeView === 'demo' && (
          <DemoDataGuideView
            onResetDemoData={handleResetDemoData}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <footer className="bg-[#EEF3F9] shadow-[0_-6px_18px_rgba(163,181,204,0.22)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#5B6C82]">
          <span className="font-semibold text-[#29384A]">TechCare DeskPilot · AI Customer Support MVP</span>
          <span>All customers, orders & policies shown are fictional demo data stored locally.</span>
        </div>
      </footer>

      <TicketModal
        isOpen={isTicketModalOpen}
        defaultCustomerName={currentUser.fullName}
        initialDraft={ticketDraft}
        isAdmin={isAdmin}
        onClose={() => {
          setIsTicketModalOpen(false);
          setTicketDraft(null);
          setSourceMessageId(null);
        }}
        onViewTickets={() => handleNavigate(isAdmin ? 'admin' : 'tickets')}
        onSubmit={handleCreateTicket}
      />

      {/* Neumorphic Notification Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="neu-surface fixed bottom-5 right-5 z-50 text-[#29384A] px-4 py-3.5 rounded-2xl flex items-center gap-3 text-sm max-w-md"
        >
          <CheckCircle2 className="w-4 h-4 text-[#548BCB] shrink-0" aria-hidden="true" />
          <span className="flex-1 font-medium">{toast.message}</span>
          {toast.actionLabel && toast.targetView && (
            <button
              type="button"
              onClick={() => {
                handleNavigate(toast.targetView!);
                setToast(null);
              }}
              className="text-xs font-bold text-[#548BCB] hover:underline whitespace-nowrap shrink-0"
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="neu-btn w-7 h-7 rounded-lg flex items-center justify-center text-[#5B6C82] hover:text-[#29384A]"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
