import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  TicketPlus,
  User,
} from 'lucide-react';
import {
  DEMO_ORDERS,
  DEMO_POLICIES,
  SUGGESTED_QUESTIONS,
} from '../data/demoData';
import {
  ActiveView,
  ChatMessage,
  SuggestedTicketDraft,
} from '../types';

interface CustomerChatViewProps {
  messages: ChatMessage[];
  customerName?: string;
  isLoading: boolean;
  errorMsg: string | null;
  onSendMessage: (text: string) => void;
  onRetryLast: () => void;
  onClearChat: () => void;
  onCreateTicketFromMessage: (messageId: string, draft?: SuggestedTicketDraft) => void;
  onNavigate: (view: ActiveView) => void;
}

function formatMessageTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function CustomerChatView({
  messages,
  customerName,
  isLoading,
  errorMsg,
  onSendMessage,
  onRetryLast,
  onClearChat,
  onCreateTicketFromMessage,
  onNavigate,
}: CustomerChatViewProps) {
  const [input, setInput] = useState('');
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;
      onSendMessage(trimmed);
      setInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#29384A]">
            Customer Support Assistant
          </h1>
          <p className="text-sm text-[#5B6C82] mt-1">
            Ask about TechCare products, shipping, returns, refunds, warranty, or order tracking in English or Hinglish.
          </p>
        </div>
        <p className="text-xs text-[#5B6C82] whitespace-nowrap">
          Demo data only · Never share real passwords or bank details
        </p>
      </div>

      {/* 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7 items-start">
        {/* Main Chatbot Highlight Surface */}
        <section
          aria-label="Support Chat Conversation"
          className="neu-surface rounded-3xl p-4 sm:p-5 flex flex-col h-[560px] sm:h-[640px] lg:h-[660px] min-h-[460px]"
        >
          {/* Chat Top Header */}
          <div className="px-2 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="neu-surface-bright w-11 h-11 rounded-2xl text-[#548BCB] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#29384A] truncate">
                  DeskPilot AI Agent
                </h2>
                <p className="text-xs text-[#5B6C82] truncate">
                  Grounded in live TechCare Knowledge Base{customerName ? ` · Demo: ${customerName}` : ' · English & Hinglish'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClearChat}
              disabled={isLoading}
              className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#548BCB]" aria-hidden="true" />
              <span>Reset Chat</span>
            </button>
          </div>

          {/* Recessed Chat Message Well */}
          <div className="neu-inset rounded-2xl flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isUser
                        ? 'bg-[#548BCB] text-white shadow-[3px_3px_8px_rgba(84,139,203,0.35),-3px_-3px_8px_rgba(255,255,255,0.75)]'
                        : msg.isError
                          ? 'neu-status-error'
                          : 'neu-surface-bright text-[#548BCB]'
                    }`}
                    aria-hidden="true"
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[82%] space-y-2.5 ${isUser ? 'items-end flex flex-col' : ''}`}
                  >
                    <div
                      className={`px-4 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-gradient-to-br from-[#5E95D6] to-[#4A7FBF] text-white shadow-[4px_4px_12px_rgba(84,139,203,0.32),-3px_-3px_8px_rgba(255,255,255,0.75)]'
                          : msg.isError
                            ? 'neu-status-error font-medium'
                            : 'neu-surface-bright text-[#29384A] ring-1 ring-[#548BCB]/15'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Ticket Escalation Action inside Assistant Reply */}
                    {!isUser && msg.suggestTicketCreation && !msg.ticketCreatedId && (
                      <div className="neu-surface-sm p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-[#5B6C82]">
                          <p className="font-semibold text-[#29384A]">
                            Need human support follow-up?
                          </p>
                          <p className="mt-0.5">
                            We can pre-fill a support ticket from this conversation for our Admin Desk.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onCreateTicketFromMessage(msg.id, msg.suggestedTicket)
                          }
                          className="neu-btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                        >
                          <TicketPlus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Create Support Ticket</span>
                        </button>
                      </div>
                    )}

                    {/* Confirmation once ticket created from this message */}
                    {!isUser && msg.ticketCreatedId && (
                      <div className="neu-status-resolved px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>
                            Ticket <span className="font-mono font-bold">{msg.ticketCreatedId}</span> recorded — your support request has been saved.
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate('tickets')}
                          className="inline-flex items-center gap-1 font-bold underline whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB] rounded"
                        >
                          <span>Track Ticket</span>
                          <ArrowRight className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </div>
                    )}

                    <span className="block text-[11px] text-[#5B6C82] tabular-nums px-1">
                      {isUser ? 'You' : 'DeskPilot'} · {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3" role="status" aria-live="polite">
                <div className="neu-surface-bright w-9 h-9 rounded-xl text-[#548BCB] flex items-center justify-center shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                </div>
                <div className="neu-surface-bright px-4 py-3 rounded-2xl text-sm text-[#5B6C82] flex items-center gap-2">
                  <span>Checking TechCare knowledge base and preparing reply...</span>
                </div>
              </div>
            )}

            {/* Clear Error Handling Banner */}
            {errorMsg && !isLoading && (
              <div
                role="alert"
                className="neu-status-error p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={onRetryLast}
                  className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#9E3333] rounded-xl whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div ref={scrollEndRef} />
          </div>

          {/* Suggested Questions Bar */}
          <div className="pt-3.5 pb-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 px-0.5">
              <span className="text-[11px] font-semibold text-[#5B6C82] whitespace-nowrap shrink-0">
                Try asking:
              </span>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isLoading}
                  onClick={() => onSendMessage(q)}
                  className="neu-btn px-3.5 py-1.5 text-xs font-medium text-[#29384A] hover:text-[#548BCB] rounded-xl whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Recessed Chat Input + Raised Send Button */}
          <form onSubmit={handleSubmit} className="flex items-end gap-3 pt-1">
            <label htmlFor="chat-message-input" className="sr-only">
              Type your support question in English or Hinglish
            </label>
            <textarea
              id="chat-message-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask in English or Hinglish (e.g. Mera order TC-1042 kahan hai?)"
              className="neu-inset flex-1 px-4 py-3 text-sm text-[#29384A] placeholder:text-[#708096] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#548BCB] resize-none min-h-[46px] max-h-28 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="neu-btn-primary inline-flex items-center justify-center gap-1.5 px-5 py-3 text-sm font-semibold rounded-2xl min-h-[46px] whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{isLoading ? 'Sending...' : 'Send'}</span>
            </button>
          </form>
        </section>

        {/* Subtly Elevated Reference Sidebar */}
        <aside className="space-y-6">
          {/* Demo Order Quick-Lookup */}
          <div className="neu-surface rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#29384A] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#548BCB]" aria-hidden="true" />
                <span>Sample Demo Orders</span>
              </h2>
              <span className="text-[11px] font-medium text-[#5B6C82]">Fictional</span>
            </div>
            <p className="text-xs text-[#5B6C82]">
              Click any sample Order ID below to ask DeskPilot for its live status:
            </p>
            <div className="space-y-2.5">
              {DEMO_ORDERS.map((order) => (
                <div
                  key={order.orderId}
                  className="neu-inset-sm p-3 rounded-2xl flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-[#29384A] tabular-nums">
                        {order.orderId}
                      </span>
                      <span aria-hidden="true" className="text-[#708096]">·</span>
                      <span className="font-medium text-[#548BCB] truncate">{order.status}</span>
                    </div>
                    <p className="text-xs text-[#5B6C82] truncate mt-0.5">
                      {order.customerName} · {order.productName}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      onSendMessage(`Please check the status of order ${order.orderId}.`)
                    }
                    className="neu-btn px-3 py-1.5 text-xs font-semibold text-[#548BCB] rounded-xl whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                  >
                    Ask AI
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Highlights */}
          <div className="neu-surface rounded-3xl p-5 space-y-3.5">
            <h2 className="text-sm font-bold text-[#29384A] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#548BCB]" aria-hidden="true" />
              <span>TechCare Policy Summary</span>
            </h2>
            <div className="space-y-2.5">
              {DEMO_POLICIES.map((pol) => (
                <div key={pol.id} className="neu-surface-bright p-3 rounded-2xl">
                  <p className="text-xs font-bold text-[#29384A]">{pol.title}</p>
                  <p className="text-xs text-[#5B6C82] mt-0.5 leading-relaxed">
                    {pol.summary}
                  </p>
                </div>
              ))}
            </div>
            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onNavigate('demo')}
                className="text-[#548BCB] hover:underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB] rounded"
              >
                View full catalog
              </button>
              <button
                type="button"
                onClick={() => onCreateTicketFromMessage('manual')}
                className="text-[#29384A] hover:text-[#548BCB] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB] rounded"
              >
                Raise ticket →
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
