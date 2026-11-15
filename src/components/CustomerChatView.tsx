import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  FileText,
  Headphones,
  Loader2,
  Mic,
  MicOff,
  Package,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  TicketPlus,
  User,
  X,
} from 'lucide-react';
import { DEMO_ORDERS, DEMO_POLICIES } from '../data/demoData';
import { ActiveView, ChatMessage, SuggestedTicketDraft } from '../types';

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

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResultItem {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultItem>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const QUICK_SUGGESTIONS = [
  {
    label: 'Track My Order',
    subtitle: 'Look up status with your Order ID',
    prompt: 'I would like to track my order.',
    icon: Package,
    tint: 'bg-[#EEF3FE] text-[#5486EA]',
  },
  {
    label: 'Warranty',
    subtitle: 'Coverage policy & claim guidance',
    prompt: 'I have a question about TechCare warranty coverage and claims.',
    icon: ShieldCheck,
    tint: 'bg-[#EAF9F3] text-[#22B983]',
  },
  {
    label: 'Refund',
    subtitle: 'Refund timelines & status lookup',
    prompt: 'What is TechCare’s refund policy, and how can I track a refund?',
    icon: CreditCard,
    tint: 'bg-[#F2EEFD] text-[#8B72E8]',
  },
  {
    label: 'Returns',
    subtitle: '14-day return policy & steps',
    prompt: 'What is TechCare’s return policy, and how do I initiate a return?',
    icon: RotateCcw,
    tint: 'bg-[#EEF7FC] text-[#3B82C4]',
  },
  {
    label: 'Product Support',
    subtitle: 'Troubleshoot a TechCare product',
    prompt: 'I need product support.',
    icon: Headphones,
    tint: 'bg-[#FFF6EB] text-[#F4AE54]',
  },
];

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

function TechCareBotEmblem({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  if (size === 'sm') {
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5486EA] to-[#8B72E8] text-white flex items-center justify-center shadow-[0_4px_12px_rgba(84,134,234,0.28)] shrink-0">
        <Bot className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#5486EA] via-[#7A7CEB] to-[#C9B9FF] p-[2px] shadow-[0_14px_34px_rgba(84,134,234,0.28)] mx-auto"
      aria-hidden="true"
    >
      <div className="w-full h-full rounded-[22px] bg-white/90 backdrop-blur-sm flex items-center justify-center relative">
        <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none">
          <defs>
            <linearGradient id="tcBotGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5486EA" />
              <stop offset="100%" stopColor="#8B72E8" />
            </linearGradient>
          </defs>
          <rect x="12" y="16" width="40" height="32" rx="14" fill="url(#tcBotGrad)" />
          <path d="M32 8V16" stroke="#5486EA" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="7" r="3" fill="#8B72E8" />
          <circle cx="24" cy="31" r="3.5" fill="#FFFFFF" />
          <circle cx="40" cy="31" r="3.5" fill="#FFFFFF" />
          <path
            d="M25 39C27 41.2 37 41.2 39 39"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <rect x="8" y="26" width="4" height="12" rx="2" fill="#C9B9FF" />
          <rect x="52" y="26" width="4" height="12" rx="2" fill="#C9B9FF" />
        </svg>
      </div>
    </div>
  );
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
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [showHelperDrawer, setShowHelperDrawer] = useState(false);

  // Speech-to-text microphone state
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseInputBeforeSpeechRef = useRef('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  const hasUserMessages = messages.some((m) => m.role === 'user');

  useEffect(() => {
    if (hasUserMessages || isLoading) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, hasUserMessages]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleMicrophone = () => {
    setSpeechError(null);

    if (isListening) {
      stopListening();
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setSpeechError(
        'Voice input is not supported in this browser. Please type your message or try Chrome/Edge.'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      baseInputBeforeSpeechRef.current = input.trim();

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i++) {
          combined += event.results[i][0]?.transcript ?? '';
        }
        const prefix = baseInputBeforeSpeechRef.current;
        const nextText = prefix ? `${prefix} ${combined.trim()}` : combined.trim();
        setInput(nextText);
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access to use voice input.');
        } else if (event.error !== 'aborted') {
          setSpeechError('Could not capture voice cleanly. Please try again or type your question.');
        }
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    } catch {
      setSpeechError('Unable to start microphone recognition in this browser.');
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  const dispatchMessage = (rawText: string) => {
    if (isListening) {
      stopListening();
    }
    const trimmed = rawText.trim();
    if (!trimmed && !attachedFileName) return;
    if (isLoading) return;

    const finalPayload = attachedFileName
      ? `${trimmed ? `${trimmed}\n` : ''}[Attached file: ${attachedFileName}]`
      : trimmed;

    onSendMessage(finalPayload);
    setInput('');
    setAttachedFileName(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      dispatchMessage(input);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
    }
    e.target.value = '';
  };

  return (
    <div className="relative h-[calc(100vh-8.5rem)] min-h-[540px] max-h-[820px] flex gap-5">
      {/* Main Spacious Chat Workspace (Reference Image 1) */}
      <section
        aria-label="Customer Support Chat"
        className="flex-1 flex flex-col chat-ambient-bg rounded-3xl border border-[#E2E8F5] shadow-[0_12px_40px_rgba(32,40,59,0.05)] overflow-hidden"
      >
        {/* Compact Glass Chat Header */}
        <div className="px-5 sm:px-6 py-3.5 bg-white/65 backdrop-blur-md border-b border-white/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <TechCareBotEmblem size="sm" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#20283B] truncate">
                DeskPilot AI Assistant
              </h2>
              <p className="text-xs text-[#78849B] truncate">
                {customerName ? `Assisting ${customerName}` : 'TechCare Support'} · English &amp; Hinglish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowHelperDrawer((prev) => !prev)}
              className="saas-btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
            >
              <Package className="w-3.5 h-3.5 text-[#5486EA]" aria-hidden="true" />
              <span className="hidden sm:inline">Orders &amp; Policies</span>
              <span className="sm:hidden">Orders</span>
            </button>

            <button
              type="button"
              onClick={onClearChat}
              disabled={isLoading}
              className="saas-btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap inline-flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#8B72E8]" aria-hidden="true" />
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Scrollable Message Canvas / Welcome Hero */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {!hasUserMessages && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6 py-4">
              <TechCareBotEmblem size="lg" />

              <div className="space-y-2.5">
                <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#20283B] leading-tight text-balance">
                  How can we help you today?
                </h2>
                <p className="text-[14px] sm:text-[15px] text-[#5D6982] max-w-lg mx-auto leading-relaxed">
                  Ask about order tracking, returns, refunds, warranty coverage, or report a damaged item in English or Hinglish.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 w-full pt-2">
                {QUICK_SUGGESTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      disabled={isLoading}
                      onClick={() => onSendMessage(item.prompt)}
                      className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] saas-glass hover:bg-white rounded-2xl p-4 text-left flex items-start gap-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(84,134,234,0.12)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
                    >
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.tint}`}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#20283B]">{item.label}</p>
                        <p className="text-xs text-[#78849B] mt-0.5">{item.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    {isUser ? (
                      <div
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5486EA] to-[#8B72E8] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                        aria-hidden="true"
                      >
                        <User className="w-4 h-4" />
                      </div>
                    ) : (
                      <TechCareBotEmblem size="sm" />
                    )}

                    <div
                      className={`max-w-[82%] space-y-2.5 ${isUser ? 'items-end flex flex-col' : ''}`}
                    >
                      <div
                        className={`px-4 py-3.5 rounded-2xl text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? 'bg-gradient-to-br from-[#5486EA] to-[#7C6EE6] text-white shadow-[0_8px_20px_rgba(84,134,234,0.24)] rounded-tr-md'
                            : msg.isError
                              ? 'bg-[#FDEEEF] border border-[#FAD5D8] text-[#C8434D] font-medium rounded-tl-md'
                              : 'bg-white/95 border border-[#E6EBF5] text-[#20283B] shadow-[0_4px_16px_rgba(32,40,59,0.04)] rounded-tl-md'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Ticket Escalation Card */}
                      {!isUser && msg.suggestTicketCreation && !msg.ticketCreatedId && (
                        <div className="bg-white/95 border border-[#DCE6FB] rounded-2xl p-4 shadow-[0_6px_20px_rgba(84,134,234,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs text-[#78849B]">
                            <p className="font-semibold text-[#20283B] text-sm">
                              Need our support team to step in?
                            </p>
                            <p className="mt-0.5">
                              Create a pre-filled support ticket from this conversation.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onCreateTicketFromMessage(msg.id, msg.suggestedTicket)
                            }
                            className="saas-btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
                          >
                            <TicketPlus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Create Support Ticket</span>
                          </button>
                        </div>
                      )}

                      {/* Ticket Recorded Confirmation */}
                      {!isUser && msg.ticketCreatedId && (
                        <div className="bg-[#EAF9F3] border border-[#CBEFE0] text-[#17875E] px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-semibold">
                            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>
                              Ticket{' '}
                              <span className="font-mono font-bold">{msg.ticketCreatedId}</span>{' '}
                              created and saved to My Tickets.
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => onNavigate('tickets')}
                            className="inline-flex items-center gap-1 font-bold underline whitespace-nowrap rounded"
                          >
                            <span>View Ticket</span>
                            <ArrowRight className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      )}

                      <span className="block text-[11px] text-[#78849B] tabular-nums px-1">
                        {isUser ? 'You' : 'DeskPilot AI'} · {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Skeleton Loading Bubble */}
              {isLoading && (
                <div className="flex items-start gap-3" role="status" aria-live="polite">
                  <TechCareBotEmblem size="sm" />
                  <div className="bg-white/95 border border-[#E6EBF5] rounded-2xl rounded-tl-md p-4 w-72 sm:w-80 space-y-2.5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#5486EA]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Preparing your reply...</span>
                    </div>
                    <div className="h-3 rounded-md saas-skeleton w-full" />
                    <div className="h-3 rounded-md saas-skeleton w-4/5" />
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMsg && !isLoading && (
                <div
                  role="alert"
                  className="bg-[#FDEEEF] border border-[#FAD5D8] text-[#C8434D] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{errorMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onRetryLast}
                    className="saas-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#C8434D] rounded-xl whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              <div ref={scrollEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Large Rounded Chat Input */}
        <div className="px-4 sm:px-8 pb-5 pt-2 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2.5">
            {hasUserMessages && (
              <div
                aria-label="Quick support actions"
                className="flex flex-wrap items-center gap-1.5 px-1"
              >
                {QUICK_SUGGESTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      disabled={isLoading}
                      onClick={() => onSendMessage(item.prompt)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/85 hover:bg-white border border-[#DCE4F5] text-xs font-semibold text-[#20283B] shadow-2xs transition-all hover:border-[#5486EA]/50 hover:text-[#5486EA] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#5486EA]" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {(isListening || speechError || attachedFileName) && (
              <div className="flex flex-wrap items-center gap-2 px-1">
                {isListening && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EEF3FE] border border-[#DCE6FB] text-xs font-semibold text-[#5486EA]">
                    <Mic className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
                    <span>Listening... Speak now or click mic to stop</span>
                  </span>
                )}
                {speechError && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FDEEEF] border border-[#FAD5D8] text-xs font-medium text-[#C8434D]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{speechError}</span>
                  </span>
                )}
                {attachedFileName && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E1E7F4] text-xs font-medium text-[#20283B]">
                    <FileText className="w-3.5 h-3.5 text-[#8B72E8]" aria-hidden="true" />
                    <span className="truncate max-w-[180px]">{attachedFileName}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFileName(null)}
                      aria-label="Remove attachment"
                      className="text-[#78849B] hover:text-[#EF747C]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="bg-white/95 backdrop-blur-md border border-[#DCE4F5] rounded-2xl p-2 shadow-[0_10px_30px_rgba(84,134,234,0.08)] flex items-end gap-2 focus-within:border-[#5486EA] focus-within:ring-3 focus-within:ring-[#5486EA]/15 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelected}
                className="hidden"
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Attach order receipt or photo reference"
                aria-label="Attach file"
                className="w-10 h-10 rounded-xl text-[#78849B] hover:text-[#5486EA] hover:bg-[#F4F6FC] flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
              >
                <Paperclip className="w-4 h-4" aria-hidden="true" />
              </button>

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
                placeholder="Ask anything in English or Hinglish (e.g. Track my order, warranty, or return policy)"
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-[#20283B] placeholder:text-[#78849B] focus:outline-none resize-none min-h-[42px] max-h-28 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={toggleMicrophone}
                disabled={isLoading}
                title={isListening ? 'Stop voice input' : 'Start voice input'}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                aria-pressed={isListening}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA] ${
                  isListening
                    ? 'bg-[#EF747C] text-white shadow-[0_4px_12px_rgba(239,116,124,0.35)]'
                    : 'text-[#78849B] hover:text-[#8B72E8] hover:bg-[#F2EEFD]'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Mic className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !attachedFileName)}
                className="saas-btn-primary h-10 px-4 rounded-xl inline-flex items-center justify-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-4 h-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{isLoading ? 'Sending' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Collapsible Sample Orders & Policies Drawer */}
      {showHelperDrawer && (
        <aside
          aria-label="Sample Orders and Policies"
          className="hidden md:flex w-80 shrink-0 flex-col saas-card rounded-3xl p-5 overflow-y-auto space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#20283B]">Orders &amp; Policies</h3>
            <button
              type="button"
              onClick={() => setShowHelperDrawer(false)}
              className="w-7 h-7 rounded-lg hover:bg-[#F4F6FC] flex items-center justify-center text-[#78849B]"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-[#78849B]">Sample Demo Orders</p>
            {DEMO_ORDERS.map((order) => (
              <div
                key={order.orderId}
                className="p-3 rounded-2xl bg-[#F4F6FC] border border-[#E6EBF5] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-mono font-bold text-[#20283B] tabular-nums">
                      {order.orderId}
                    </span>
                    <span className="text-[#78849B]">·</span>
                    <span className="font-medium text-[#5486EA] truncate">{order.status}</span>
                  </div>
                  <p className="text-xs text-[#78849B] truncate mt-0.5">{order.productName}</p>
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    onSendMessage(`Please check the status of order ${order.orderId}.`)
                  }
                  className="saas-btn-secondary px-2.5 py-1 text-xs font-semibold text-[#5486EA] rounded-lg shrink-0"
                >
                  Ask
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 pt-2 border-t border-[#EDF1FA]">
            <p className="text-xs font-semibold text-[#78849B]">TechCare Policies</p>
            {DEMO_POLICIES.map((pol) => (
              <div key={pol.id} className="p-3 rounded-2xl bg-[#F7F9FD] border border-[#EDF1FA]">
                <p className="text-xs font-semibold text-[#20283B]">{pol.title}</p>
                <p className="text-xs text-[#78849B] mt-0.5 leading-relaxed">{pol.summary}</p>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
