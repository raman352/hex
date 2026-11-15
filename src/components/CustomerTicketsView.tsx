import { useEffect, useMemo, useState } from 'react';
import { Eye, Plus, Search, Ticket, Trash2, X } from 'lucide-react';
import {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../types';
import { PriorityLabel, StatusLabel } from './StatusLabels';

interface CustomerTicketsViewProps {
  tickets: SupportTicket[];
  isAdmin?: boolean;
  searchQueryExternal?: string;
  onOpenNewTicket: () => void;
  onUpdateTicket?: (
    ticketId: string,
    updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'adminNote'>>
  ) => void;
  onDeleteTicket?: (ticketId: string) => void;
}

function formatDate(iso: string): string {
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

export function CustomerTicketsView({
  tickets,
  isAdmin = false,
  searchQueryExternal = '',
  onOpenNewTicket,
  onUpdateTicket,
  onDeleteTicket,
}: CustomerTicketsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TicketPriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const effectiveSearch = (searchQuery || searchQueryExternal).trim().toLowerCase();

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (!effectiveSearch) return true;
      return (
        t.id.toLowerCase().includes(effectiveSearch) ||
        t.orderId.toLowerCase().includes(effectiveSearch) ||
        t.customerName.toLowerCase().includes(effectiveSearch) ||
        t.description.toLowerCase().includes(effectiveSearch)
      );
    });
  }, [tickets, effectiveSearch, statusFilter, priorityFilter, categoryFilter]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );

  const openDetails = (ticket: SupportTicket) => {
    setSelectedTicketId(ticket.id);
    setNoteDraft(ticket.adminNote || '');
    setConfirmDeleteId(null);
  };

  const closeDetails = () => {
    setSelectedTicketId(null);
    setConfirmDeleteId(null);
  };

  useEffect(() => {
    if (!selectedTicketId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetails();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedTicketId]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#20283B]">
            {isAdmin ? 'Ticket Management' : 'My Support Tickets'}
          </h2>
          <p className="text-sm text-[#78849B] mt-1">
            {isAdmin
              ? 'Filter, inspect, and update resolution statuses across all customer support requests.'
              : 'Track your submitted support requests and view live updates from the TechCare team.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewTicket}
          className="saas-btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Search & Multi-Filter Toolbar */}
      <div className="saas-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-[#78849B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Ticket ID, Order ID, customer, or issue..."
              className="saas-input w-full pl-10 pr-4 py-2 text-sm rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-[#F4F6FC] border border-[#E6EBF5] flex items-center gap-1 p-1 rounded-xl overflow-x-auto max-w-full">
              {(['ALL', TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED] as const).map(
                (tab) => {
                  const active = statusFilter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-white text-[#5486EA] shadow-xs'
                          : 'text-[#78849B] hover:text-[#20283B]'
                      }`}
                    >
                      {tab === 'ALL' ? 'All' : tab}
                    </button>
                  );
                }
              )}
            </div>

            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | TicketPriority)}
              className="saas-input px-3 py-2 text-xs font-semibold rounded-xl min-h-[36px]"
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
              className="saas-input px-3 py-2 text-xs font-semibold rounded-xl min-h-[36px]"
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

      {/* Empty State or Responsive Ticket Table */}
      {filteredTickets.length === 0 ? (
        <div className="saas-card rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF3FE] text-[#5486EA] flex items-center justify-center mx-auto">
            <Ticket className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-[#20283B]">No matching tickets found</h3>
          <p className="text-sm text-[#78849B] max-w-md mx-auto">
            {tickets.length === 0
              ? 'You have not submitted any support tickets yet.'
              : 'Try clearing your search query or adjusting the active filters.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {(effectiveSearch ||
              statusFilter !== 'ALL' ||
              priorityFilter !== 'ALL' ||
              categoryFilter !== 'ALL') && (
              <button
                type="button"
                onClick={resetFilters}
                className="saas-btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={onOpenNewTicket}
              className="saas-btn-primary px-4 py-2 text-xs font-semibold rounded-xl"
            >
              Create Support Ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="saas-card rounded-3xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F9FD] text-xs font-semibold text-[#78849B] border-b border-[#EDF1FA]">
                  <th className="py-3.5 px-4 whitespace-nowrap">Ticket ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Customer &amp; Order</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3.5 px-4">Complaint Summary</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Priority</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Created</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1FA] text-sm">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-[#F7F9FE] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#20283B] tabular-nums whitespace-nowrap">
                      {ticket.id}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-[#20283B]">
                        {ticket.customerName}
                      </div>
                      <div className="text-xs font-mono text-[#78849B] tabular-nums">
                        Order: {ticket.orderId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#78849B] whitespace-nowrap">
                      {ticket.category}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#20283B] max-w-sm">
                      <p className="line-clamp-2">{ticket.description}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityLabel priority={ticket.priority} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#78849B] tabular-nums whitespace-nowrap">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isAdmin && onUpdateTicket ? (
                        <select
                          aria-label={`Change status for ${ticket.id}`}
                          value={ticket.status}
                          onChange={(e) =>
                            onUpdateTicket(ticket.id, {
                              status: e.target.value as TicketStatus,
                            })
                          }
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#5486EA] ${
                            ticket.status === TicketStatus.OPEN
                              ? 'bg-[#EEF3FE] text-[#3B6FD4] border-[#DCE6FB]'
                              : ticket.status === TicketStatus.IN_PROGRESS
                                ? 'bg-[#FFF6EB] text-[#B86F14] border-[#FBE5C8]'
                                : 'bg-[#EAF9F3] text-[#17875E] border-[#CBEFE0]'
                          }`}
                        >
                          {Object.values(TicketStatus).map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <StatusLabel status={ticket.status} />
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openDetails(ticket)}
                        className="saas-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5486EA] rounded-xl"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-[#EDF1FA]">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#5486EA] tabular-nums">
                      {ticket.id}
                    </span>
                    <p className="text-sm font-semibold text-[#20283B] mt-0.5">
                      {ticket.customerName} ·{' '}
                      <span className="font-mono text-xs text-[#78849B]">
                        {ticket.orderId}
                      </span>
                    </p>
                  </div>
                  <PriorityLabel priority={ticket.priority} />
                </div>

                <p className="text-xs text-[#20283B] leading-relaxed">
                  {ticket.description}
                </p>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <StatusLabel status={ticket.status} />
                  <button
                    type="button"
                    onClick={() => openDetails(ticket)}
                    className="saas-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5486EA] rounded-xl"
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#20283B]/35 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-detail-title"
        >
          <div className="bg-white rounded-3xl border border-[#E6EBF5] shadow-[0_24px_60px_rgba(32,40,59,0.18)] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[#EDF1FA] flex items-center justify-between shrink-0">
              <div>
                <h2
                  id="ticket-detail-title"
                  className="text-base font-bold text-[#20283B] font-mono tabular-nums"
                >
                  {selectedTicket.id}
                </h2>
                <p className="text-xs text-[#78849B] mt-0.5">
                  {selectedTicket.category} · Created {formatDate(selectedTicket.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="w-9 h-9 rounded-xl border border-[#E6EBF5] hover:bg-[#F4F6FC] flex items-center justify-center text-[#78849B] hover:text-[#20283B]"
                aria-label="Close ticket details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#F4F6FC] p-3.5 rounded-2xl border border-[#E6EBF5]">
                  <span className="text-xs text-[#78849B] block">Customer</span>
                  <span className="font-semibold text-[#20283B]">
                    {selectedTicket.customerName}
                  </span>
                </div>
                <div className="bg-[#F4F6FC] p-3.5 rounded-2xl border border-[#E6EBF5]">
                  <span className="text-xs text-[#78849B] block">Order ID</span>
                  <span className="font-mono font-semibold text-[#20283B] tabular-nums">
                    {selectedTicket.orderId}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#78849B] block mb-1.5">
                  Description
                </span>
                <p className="bg-[#F7F9FD] border border-[#E6EBF5] text-sm text-[#20283B] p-4 rounded-2xl leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusLabel status={selectedTicket.status} />
                <PriorityLabel priority={selectedTicket.priority} />
              </div>

              {isAdmin && onUpdateTicket ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="tm-status"
                        className="block text-xs font-semibold text-[#20283B] mb-1.5"
                      >
                        Update Status
                      </label>
                      <select
                        id="tm-status"
                        value={selectedTicket.status}
                        onChange={(e) =>
                          onUpdateTicket(selectedTicket.id, {
                            status: e.target.value as TicketStatus,
                          })
                        }
                        className="saas-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                      >
                        {Object.values(TicketStatus).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="tm-priority"
                        className="block text-xs font-semibold text-[#20283B] mb-1.5"
                      >
                        Update Priority
                      </label>
                      <select
                        id="tm-priority"
                        value={selectedTicket.priority}
                        onChange={(e) =>
                          onUpdateTicket(selectedTicket.id, {
                            priority: e.target.value as TicketPriority,
                          })
                        }
                        className="saas-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                      >
                        {Object.values(TicketPriority).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label
                      htmlFor="tm-note"
                      className="block text-xs font-semibold text-[#20283B]"
                    >
                      Resolution Note
                    </label>
                    <textarea
                      id="tm-note"
                      rows={3}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Add resolution update for the customer..."
                      className="saas-input w-full px-3.5 py-2.5 text-sm rounded-2xl resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTicket(selectedTicket.id, {
                            adminNote: noteDraft.trim(),
                          })
                        }
                        className="saas-btn-primary px-4 py-2 text-xs font-semibold rounded-xl"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                selectedTicket.adminNote && (
                  <div className="bg-[#EEF3FE] border border-[#DCE6FB] text-[#20283B] p-4 rounded-2xl text-xs leading-relaxed">
                    <span className="font-bold text-[#5486EA] block mb-1">
                      Support Team Update
                    </span>
                    {selectedTicket.adminNote}
                  </div>
                )
              )}

              <div className="pt-3 border-t border-[#EDF1FA] flex flex-wrap items-center justify-between gap-2">
                {isAdmin && onDeleteTicket ? (
                  confirmDeleteId === selectedTicket.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[#EF747C] font-semibold">
                        Delete permanently?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteTicket(selectedTicket.id);
                          closeDetails();
                        }}
                        className="saas-btn-danger px-3 py-1.5 text-xs font-semibold rounded-xl"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="saas-btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedTicket.id)}
                      className="saas-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#EF747C] rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Delete Ticket</span>
                    </button>
                  )
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={closeDetails}
                  className="saas-btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
