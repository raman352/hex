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
      setError('Please enter your name (or a demo customer name).');
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#29384A]/35 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <div className="neu-surface rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 id="ticket-modal-title" className="text-lg font-bold text-[#29384A]">
              {submittedTicket ? 'Support Ticket Recorded' : 'Create Support Ticket'}
            </h2>
            <p className="text-xs text-[#5B6C82] mt-0.5">
              {submittedTicket
                ? 'Your support request has been recorded and synced with our Admin Desk.'
                : 'Saved locally in your browser so our Admin Desk can track and resolve it.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[#5B6C82] hover:text-[#29384A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedTicket ? (
          <div className="px-6 pb-6 space-y-5 overflow-y-auto">
            <div
              role="status"
              aria-live="polite"
              className="neu-status-resolved p-4 rounded-2xl flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="text-sm font-bold">
                  Your support request has been recorded!
                </p>
                <p>
                  Generated Ticket ID:{' '}
                  <span className="font-mono font-bold text-sm tabular-nums">
                    {submittedTicket.id}
                  </span>
                </p>
                <p>
                  Our support team will review your request and update its status from{' '}
                  <strong>{submittedTicket.status}</strong> as they work on it.
                </p>
              </div>
            </div>

            <div className="neu-inset-sm rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#5B6C82] block">Customer</span>
                  <span className="font-semibold text-[#29384A]">
                    {submittedTicket.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[#5B6C82] block">Order ID</span>
                  <span className="font-mono font-semibold text-[#29384A] tabular-nums">
                    {submittedTicket.orderId}
                  </span>
                </div>
                <div>
                  <span className="text-[#5B6C82] block">Category</span>
                  <span className="font-semibold text-[#29384A]">
                    {submittedTicket.category}
                  </span>
                </div>
                <div>
                  <span className="text-[#5B6C82] block">Priority · Status</span>
                  <span className="font-semibold text-[#29384A]">
                    {submittedTicket.priority} · {submittedTicket.status}
                  </span>
                </div>
              </div>
              <div className="pt-1 border-t border-[#D5E0EC]">
                <span className="text-[#5B6C82] block mb-1">Recorded Description</span>
                <p className="text-[#29384A] leading-relaxed">{submittedTicket.description}</p>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="neu-btn px-4 py-2.5 text-sm font-semibold rounded-xl min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
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
                  className="neu-btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                >
                  <span>{isAdmin ? 'View in Admin Desk' : 'View My Tickets'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 overflow-y-auto">
            <div className="neu-inset-sm flex items-start gap-2.5 p-3.5 rounded-2xl text-xs text-[#29384A]">
              <ShieldAlert className="w-4 h-4 text-[#548BCB] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Demo Environment:</strong> Use fictional details or sample orders below. Never enter real passwords, card numbers, or bank details.
              </span>
            </div>

            {error && (
              <div role="alert" className="neu-status-error p-3.5 rounded-2xl text-xs font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tkt-name" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                  Customer Name <span className="text-[#B83B3B]">*</span>
                </label>
                <input
                  id="tkt-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="neu-inset-sm w-full px-3.5 py-2.5 text-sm text-[#29384A] placeholder:text-[#708096] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
                />
              </div>

              <div>
                <label htmlFor="tkt-order" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                  Order ID
                </label>
                <input
                  id="tkt-order"
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. TC-1042"
                  className="neu-inset-sm w-full px-3.5 py-2.5 text-sm font-mono text-[#29384A] placeholder:text-[#708096] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#5B6C82]">
                  <span>Demo:</span>
                  {DEMO_ORDERS.slice(0, 3).map((o) => (
                    <button
                      key={o.orderId}
                      type="button"
                      onClick={() => handleFillSample(o.orderId)}
                      className="neu-btn px-2 py-0.5 rounded-lg font-mono text-[#548BCB] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                    >
                      {o.orderId}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tkt-category" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                  Category
                </label>
                <select
                  id="tkt-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="neu-inset-sm w-full px-3.5 py-2.5 text-sm text-[#29384A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
                >
                  {Object.values(TicketCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tkt-priority" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                  Priority
                </label>
                <select
                  id="tkt-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="neu-inset-sm w-full px-3.5 py-2.5 text-sm text-[#29384A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
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
              <label htmlFor="tkt-desc" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                Complaint Description <span className="text-[#B83B3B]">*</span>
              </label>
              <textarea
                id="tkt-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue with your product, delivery, or refund request..."
                className="neu-inset-sm w-full px-3.5 py-2.5 text-sm text-[#29384A] placeholder:text-[#708096] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB] resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="neu-btn px-4 py-2.5 text-sm font-semibold rounded-xl min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="neu-btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl min-h-[42px] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
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
