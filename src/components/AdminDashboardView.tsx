import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { DEMO_ORDERS } from '../data/demoData';
import {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../types';
import { PriorityLabel, StatusLabel } from './StatusLabels';

interface AdminDashboardViewProps {
  tickets: SupportTicket[];
  onUpdateTicket: (
    ticketId: string,
    updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'adminNote'>>
  ) => void;
  onDeleteTicket: (ticketId: string) => void;
  onOpenKnowledgeBase?: () => void;
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function AdminDashboardView({
  tickets,
  onUpdateTicket,
  onDeleteTicket,
  onOpenKnowledgeBase,
}: AdminDashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TicketPriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
      inProgress: tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length,
      resolved: tickets.filter((t) => t.status === TicketStatus.RESOLVED).length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.orderId.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  const matchedDemoOrder = useMemo(() => {
    if (!selectedTicket) return null;
    return (
      DEMO_ORDERS.find(
        (o) => o.orderId.toLowerCase() === selectedTicket.orderId.toLowerCase()
      ) ?? null
    );
  }, [selectedTicket]);

  const openInspector = (ticket: SupportTicket) => {
    setSelectedTicketId(ticket.id);
    setNoteDraft(ticket.adminNote || '');
    setConfirmDeleteId(null);
  };

  const closeInspector = () => {
    setSelectedTicketId(null);
    setConfirmDeleteId(null);
  };

  useEffect(() => {
    if (!selectedTicketId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeInspector();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicketId]);

  const handleSaveNote = () => {
    if (!selectedTicket) return;
    onUpdateTicket(selectedTicket.id, { adminNote: noteDraft.trim() });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#29384A]">
            Admin Support Desk
          </h1>
          <p className="text-sm text-[#5B6C82] mt-1">
            Monitor incoming customer complaints, update resolution statuses, and inspect order context.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onOpenKnowledgeBase && (
            <button
              type="button"
              onClick={onOpenKnowledgeBase}
              className="neu-btn inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#548BCB] rounded-xl whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Manage Knowledge Base</span>
            </button>
          )}
          <p className="text-xs text-[#5B6C82] whitespace-nowrap">
            Changes persist automatically in localStorage
          </p>
        </div>
      </div>

      {/* 4 Soft Raised Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="neu-surface rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5B6C82]">Total Tickets</span>
            <span className="neu-inset-sm w-8 h-8 rounded-xl flex items-center justify-center text-[#548BCB]">
              <Inbox className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          <p className="text-3xl font-bold text-[#29384A] mt-3 tabular-nums">
            {metrics.total}
          </p>
        </div>

        <div className="neu-surface rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#2B5E99]">Open</span>
            <span className="neu-status-open px-2 py-0.5 rounded-lg text-[11px] font-semibold">
              Needs triage
            </span>
          </div>
          <p className="text-3xl font-bold text-[#29384A] mt-3 tabular-nums">
            {metrics.open}
          </p>
        </div>

        <div className="neu-surface rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8F5312]">In Progress</span>
            <span className="neu-status-progress w-8 h-8 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          <p className="text-3xl font-bold text-[#29384A] mt-3 tabular-nums">
            {metrics.inProgress}
          </p>
        </div>

        <div className="neu-surface rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1B6D4B]">Resolved</span>
            <span className="neu-status-resolved w-8 h-8 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </span>
          </div>
          <p className="text-3xl font-bold text-[#29384A] mt-3 tabular-nums">
            {metrics.resolved}
          </p>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="neu-surface rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-[#5B6C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticket ID, customer, order ID, or complaint..."
              className="neu-inset-sm w-full pl-10 pr-4 py-2.5 text-sm text-[#29384A] placeholder:text-[#708096] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="neu-inset-sm flex items-center gap-1 p-1.5 rounded-2xl overflow-x-auto max-w-full">
              {(['ALL', TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB] ${
                      statusFilter === st
                        ? 'neu-surface-sm text-[#548BCB]'
                        : 'text-[#5B6C82] hover:text-[#29384A]'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st}
                  </button>
                )
              )}
            </div>

            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | TicketPriority)}
              className="neu-inset-sm px-3.5 py-2 text-xs font-semibold text-[#29384A] rounded-xl min-h-[38px] focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
            >
              <option value="ALL">All Priorities</option>
              {Object.values(TicketPriority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | TicketCategory)}
              className="neu-inset-sm px-3.5 py-2 text-xs font-semibold text-[#29384A] rounded-xl min-h-[38px] focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
            >
              <option value="ALL">All Categories</option>
              {Object.values(TicketCategory).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Data Table */}
      <div className="neu-surface rounded-3xl overflow-hidden p-2 sm:p-3">
        {filteredTickets.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="neu-surface-bright w-12 h-12 rounded-2xl text-[#548BCB] flex items-center justify-center mx-auto">
              <Inbox className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-base font-bold text-[#29384A]">
              {tickets.length === 0 ? 'No support tickets recorded yet' : 'No tickets match your filters'}
            </h2>
            <p className="text-sm text-[#5B6C82] max-w-md mx-auto">
              {tickets.length === 0
                ? 'Customer support tickets submitted from the chatbot or Ticket Management will appear here.'
                : 'Adjust your search terms or reset the filters to view all support tickets.'}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="neu-btn px-4 py-2.5 text-sm font-semibold text-[#548BCB] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-[#5B6C82] border-b border-[#D5E0EC]">
                    <th className="py-3.5 px-4 whitespace-nowrap">Ticket ID</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Customer & Order</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                    <th className="py-3.5 px-4">Complaint Summary</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Priority</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Created</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE6F2] text-sm">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-[#F5F9FE]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#29384A] tabular-nums whitespace-nowrap">
                        {ticket.id}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#29384A]">
                          {ticket.customerName}
                        </div>
                        <div className="text-xs font-mono text-[#5B6C82] tabular-nums">
                          {ticket.orderId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5B6C82] whitespace-nowrap">
                        {ticket.category}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#29384A] max-w-xs">
                        <p className="line-clamp-2">{ticket.description}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityLabel priority={ticket.priority} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5B6C82] tabular-nums whitespace-nowrap">
                        {formatShortDate(ticket.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          aria-label={`Change status for ${ticket.id}`}
                          value={ticket.status}
                          onChange={(e) =>
                            onUpdateTicket(ticket.id, {
                              status: e.target.value as TicketStatus,
                            })
                          }
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB] ${
                            ticket.status === TicketStatus.OPEN
                              ? 'neu-status-open'
                              : ticket.status === TicketStatus.IN_PROGRESS
                                ? 'neu-status-progress'
                                : 'neu-status-resolved'
                          }`}
                        >
                          {Object.values(TicketStatus).map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openInspector(ticket)}
                          className="neu-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#29384A] hover:text-[#548BCB] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3 p-2">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="neu-surface-bright rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#29384A] tabular-nums">
                        {ticket.id}
                      </span>
                      <p className="text-sm font-semibold text-[#29384A] mt-0.5">
                        {ticket.customerName} ·{' '}
                        <span className="font-mono text-xs text-[#5B6C82]">
                          {ticket.orderId}
                        </span>
                      </p>
                    </div>
                    <PriorityLabel priority={ticket.priority} />
                  </div>

                  <p className="text-xs text-[#29384A] leading-relaxed">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select
                      aria-label={`Change status for ${ticket.id}`}
                      value={ticket.status}
                      onChange={(e) =>
                        onUpdateTicket(ticket.id, {
                          status: e.target.value as TicketStatus,
                        })
                      }
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB] ${
                        ticket.status === TicketStatus.OPEN
                          ? 'neu-status-open'
                          : ticket.status === TicketStatus.IN_PROGRESS
                            ? 'neu-status-progress'
                            : 'neu-status-resolved'
                      }`}
                    >
                      {Object.values(TicketStatus).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => openInspector(ticket)}
                      className="neu-btn inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-[#548BCB] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Ticket Detail Inspector Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#29384A]/35 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspector-title"
        >
          <div className="neu-surface rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <h2 id="inspector-title" className="text-base font-bold text-[#29384A] font-mono tabular-nums">
                  {selectedTicket.id}
                </h2>
                <p className="text-xs text-[#5B6C82] mt-0.5">
                  {selectedTicket.category} · Created {formatShortDate(selectedTicket.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeInspector}
                className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-[#5B6C82] hover:text-[#29384A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                aria-label="Close ticket details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="neu-surface-bright p-3.5 rounded-2xl">
                  <span className="text-xs text-[#5B6C82] block">Customer</span>
                  <span className="font-semibold text-[#29384A]">{selectedTicket.customerName}</span>
                </div>
                <div className="neu-surface-bright p-3.5 rounded-2xl">
                  <span className="text-xs text-[#5B6C82] block">Order ID</span>
                  <span className="font-mono font-semibold text-[#29384A] tabular-nums">
                    {selectedTicket.orderId}
                  </span>
                </div>
              </div>

              {matchedDemoOrder && (
                <div className="neu-status-open p-4 rounded-2xl text-xs space-y-1">
                  <p className="font-bold">
                    Matched Demo Order Record ({matchedDemoOrder.orderId})
                  </p>
                  <p>
                    {matchedDemoOrder.productName} · Status: {matchedDemoOrder.status}
                  </p>
                  <p>
                    {matchedDemoOrder.carrier} ({matchedDemoOrder.trackingNumber}) · {matchedDemoOrder.estimatedDelivery}
                  </p>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-[#5B6C82] block mb-1.5">
                  Customer Complaint
                </span>
                <p className="neu-inset-sm text-sm text-[#29384A] p-4 rounded-2xl leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-status-select" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                    Ticket Status
                  </label>
                  <select
                    id="admin-status-select"
                    value={selectedTicket.status}
                    onChange={(e) =>
                      onUpdateTicket(selectedTicket.id, {
                        status: e.target.value as TicketStatus,
                      })
                    }
                    className="neu-inset-sm w-full px-3.5 py-2.5 text-sm text-[#29384A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
                  >
                    {Object.values(TicketStatus).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="admin-priority-select" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                    Priority
                  </label>
                  <select
                    id="admin-priority-select"
                    value={selectedTicket.priority}
                    onChange={(e) =>
                      onUpdateTicket(selectedTicket.id, {
                        priority: e.target.value as TicketPriority,
                      })
                    }
                    className="neu-inset-sm w-full px-3.5 py-2.5 text-sm text-[#29384A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
                  >
                    {Object.values(TicketPriority).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="admin-note-input" className="block text-xs font-semibold text-[#29384A] mb-1.5">
                  Resolution Note (Visible in Customer Ticket Tracker)
                </label>
                <div className="space-y-3">
                  <textarea
                    id="admin-note-input"
                    rows={3}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add resolution summary, pickup tracking, or follow-up steps..."
                    className="neu-inset-sm w-full px-3.5 py-2.5 text-sm text-[#29384A] placeholder:text-[#708096] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#548BCB] resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <StatusLabel status={selectedTicket.status} />
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="neu-btn-primary px-4 py-2 text-xs font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                {confirmDeleteId === selectedTicket.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[#9E3333] font-semibold">Delete permanently?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteTicket(selectedTicket.id);
                        closeInspector();
                      }}
                      className="neu-btn-danger px-3 py-1.5 text-xs font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B83B3B]"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="neu-btn px-3 py-1.5 text-xs font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(selectedTicket.id)}
                    className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#B83B3B] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B83B3B]"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Delete Ticket</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeInspector}
                  className="neu-btn px-4 py-2 text-sm font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
