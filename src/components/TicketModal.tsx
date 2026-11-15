import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { DEMO_ORDERS } from '../data/demoData';
import {
  SuggestedTicketDraft,
  SupportTicket,
  TicketCategory,
  TicketPriority,
} from '../types';

export interface TicketSubmitResult {
  ok: boolean;
  ticket?: SupportTicket;
  error?: string;
}

interface TicketModalProps {
  isOpen: boolean;
  defaultCustomerName?: string;
  initialDraft?: SuggestedTicketDraft | null;
  isAdmin?: boolean;
  onClose: () => void;
  onViewTickets?: () => void;
  onSubmit: (ticketData: {
    customerName: string;
    orderId: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => TicketSubmitResult;
}

export function TicketModal({
  isOpen,
  defaultCustomerName = '',
  initialDraft,
  isAdmin = false,
  onClose,
  onViewTickets,
  onSubmit,
}: TicketModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [category, setCategory] = useState<TicketCategory>(TicketCategory.GENERAL);
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomerName(initialDraft?.customerName || defaultCustomerName || '');
      setOrderId(initialDraft?.orderId || '');
      setCategory(initialDraft?.category || TicketCategory.GENERAL);
      setPriority(initialDraft?.priority || TicketPriority.MEDIUM);
      setDescription(initialDraft?.description || '');
      setError('');
      setIsSubmitting(false);
      setSubmittedTicket(null);
    }
  }, [isOpen, initialDraft, defaultCustomerName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submittedTicket) return;

    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!description.trim() || description.trim().length < 8) {
      setError('Please provide a clear description of your issue (at least 8 characters).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = onSubmit({
      customerName: customerName.trim(),
      orderId: orderId.trim() || 'N/A',
      description: description.trim(),
      category,
      priority,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Could not submit ticket. Please review your details.');
      return;
    }

    if (result.ticket) {
      setSubmittedTicket(result.ticket);
    } else {
      onClose();
    }
  };

  const handleFillSample = (sampleOrderId: string) => {
    const found = DEMO_ORDERS.find((o) => o.orderId === sampleOrderId);
    if (found) {
      setOrderId(found.orderId);
      if (!customerName.trim()) {
        setCustomerName(found.customerName);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#20283B]/35 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <div className="bg-white rounded-3xl border border-[#E6EBF5] shadow-[0_24px_60px_rgba(32,40,59,0.18)] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-[#EDF1FA] flex items-center justify-between shrink-0">
          <div>
            <h2 id="ticket-modal-title" className="text-lg font-bold text-[#20283B]">
              {submittedTicket ? 'Support Ticket Recorded' : 'Create Support Ticket'}
            </h2>
            <p className="text-xs text-[#78849B] mt-0.5">
              {submittedTicket
                ? 'Your support request has been recorded and synced.'
                : 'Submit an issue for the TechCare support team to review.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-[#E6EBF5] hover:bg-[#F4F6FC] flex items-center justify-center text-[#78849B] hover:text-[#20283B]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedTicket ? (
          <div className="px-6 py-5 space-y-5 overflow-y-auto">
            <div
              role="status"
              aria-live="polite"
              className="bg-[#EAF9F3] border border-[#CBEFE0] text-[#17875E] p-4 rounded-2xl flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="text-sm font-bold">Your support request has been recorded!</p>
                <p>
                  Ticket ID:{' '}
                  <span className="font-mono font-bold text-sm tabular-nums">
                    {submittedTicket.id}
                  </span>
                </p>
                <p>
                  Current status: <strong>{submittedTicket.status}</strong>.
                </p>
              </div>
            </div>

            <div className="bg-[#F4F6FC] border border-[#E6EBF5] rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#78849B] block">Customer</span>
                  <span className="font-semibold text-[#20283B]">
                    {submittedTicket.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[#78849B] block">Order ID</span>
                  <span className="font-mono font-semibold text-[#20283B] tabular-nums">
                    {submittedTicket.orderId}
                  </span>
                </div>
                <div>
                  <span className="text-[#78849B] block">Category</span>
                  <span className="font-semibold text-[#20283B]">
                    {submittedTicket.category}
                  </span>
                </div>
                <div>
                  <span className="text-[#78849B] block">Priority · Status</span>
                  <span className="font-semibold text-[#20283B]">
                    {submittedTicket.priority} · {submittedTicket.status}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E6EBF5]">
                <span className="text-[#78849B] block mb-1">Description</span>
                <p className="text-[#20283B] leading-relaxed">{submittedTicket.description}</p>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="saas-btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Done
              </button>
              {onViewTickets && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewTickets();
                  }}
                  className="saas-btn-primary inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl"
                >
                  <span>{isAdmin ? 'View in Admin Overview' : 'View My Tickets'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
            <div className="bg-[#EEF3FE] border border-[#DCE6FB] flex items-start gap-2.5 p-3.5 rounded-2xl text-xs text-[#20283B]">
              <ShieldAlert className="w-4 h-4 text-[#5486EA] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Demo Environment:</strong> Use fictional details or sample orders below. Never enter real passwords or payment card details.
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-[#FDEEEF] border border-[#FAD5D8] text-[#C8434D] p-3.5 rounded-2xl text-xs font-medium"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tkt-name"
                  className="block text-xs font-semibold text-[#20283B] mb-1.5"
                >
                  Customer Name <span className="text-[#EF747C]">*</span>
                </label>
                <input
                  id="tkt-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="saas-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                />
              </div>

              <div>
                <label
                  htmlFor="tkt-order"
                  className="block text-xs font-semibold text-[#20283B] mb-1.5"
                >
                  Order ID
                </label>
                <input
                  id="tkt-order"
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. TC-1042"
                  className="saas-input w-full px-3.5 py-2.5 text-sm font-mono rounded-xl"
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#78849B]">
                  <span>Sample:</span>
                  {DEMO_ORDERS.slice(0, 3).map((o) => (
                    <button
                      key={o.orderId}
                      type="button"
                      onClick={() => handleFillSample(o.orderId)}
                      className="saas-btn-secondary px-2 py-0.5 rounded-lg font-mono text-[#5486EA] font-semibold"
                    >
                      {o.orderId}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tkt-category"
                  className="block text-xs font-semibold text-[#20283B] mb-1.5"
                >
                  Category
                </label>
                <select
                  id="tkt-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="saas-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                >
                  {Object.values(TicketCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="tkt-priority"
                  className="block text-xs font-semibold text-[#20283B] mb-1.5"
                >
                  Priority
                </label>
                <select
                  id="tkt-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="saas-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                >
                  {Object.values(TicketPriority).map((pri) => (
                    <option key={pri} value={pri}>
                      {pri}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="tkt-desc"
                className="block text-xs font-semibold text-[#20283B] mb-1.5"
              >
                Complaint Description <span className="text-[#EF747C]">*</span>
              </label>
              <textarea
                id="tkt-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue with your product, delivery, or refund request..."
                className="saas-input w-full px-3.5 py-2.5 text-sm rounded-xl resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="saas-btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="saas-btn-primary px-5 py-2 text-xs font-semibold rounded-xl disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
