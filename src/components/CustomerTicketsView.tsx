import { useMemo, useState } from 'react';
import { Plus, Search, Ticket } from 'lucide-react';
import { SupportTicket, TicketStatus } from '../types';
import { PriorityLabel, StatusLabel } from './StatusLabels';

interface CustomerTicketsViewProps {
  tickets: SupportTicket[];
  isAdmin?: boolean;
  onOpenNewTicket: () => void;
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
  onOpenNewTicket,
}: CustomerTicketsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.orderId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [tickets, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#29384A]">
            {isAdmin ? 'Ticket Management' : 'My Support Tickets'}
          </h1>
          <p className="text-sm text-[#5B6C82] mt-1">
            {isAdmin
              ? 'View all submitted customer support requests stored locally and create new tickets.'
              : 'Track submitted requests and view live status updates from the TechCare Admin Desk.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewTicket}
          className="neu-btn-primary inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="neu-surface rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-[#5B6C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Ticket ID, Order ID, or name..."
            className="neu-inset-sm w-full pl-10 pr-4 py-2.5 text-sm text-[#29384A] placeholder:text-[#708096] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
          />
        </div>

        <div className="neu-inset-sm flex items-center gap-1.5 p-1.5 rounded-2xl overflow-x-auto">
          {(['ALL', TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED] as const).map(
            (tab) => {
              const active = statusFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB] ${
                    active
                      ? 'neu-surface-sm text-[#548BCB]'
                      : 'text-[#5B6C82] hover:text-[#29384A]'
                  }`}
                >
                  {tab === 'ALL' ? 'All Tickets' : tab}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="neu-surface rounded-3xl p-10 text-center space-y-3">
          <div className="neu-surface-bright w-12 h-12 rounded-2xl text-[#548BCB] flex items-center justify-center mx-auto">
            <Ticket className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-[#29384A]">No matching tickets found</h2>
          <p className="text-sm text-[#5B6C82] max-w-md mx-auto">
            {tickets.length === 0
              ? 'You have not submitted any support tickets yet.'
              : 'Try clearing your search query or switching the status filter.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="neu-btn px-4 py-2.5 text-sm font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={onOpenNewTicket}
              className="neu-btn-primary px-4 py-2.5 text-sm font-semibold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
            >
              Create Support Ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <article key={ticket.id} className="neu-surface rounded-3xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6C82]">
                  <span className="font-mono font-bold text-[#29384A] tabular-nums">
                    {ticket.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-[#29384A]">{ticket.customerName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">Order: {ticket.orderId}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ticket.category}</span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <PriorityLabel priority={ticket.priority} />
                  <StatusLabel status={ticket.status} />
                </div>
              </div>

              <p className="text-sm text-[#29384A] mt-3 leading-relaxed">
                {ticket.description}
              </p>

              {ticket.adminNote && (
                <div className="neu-inset-sm mt-3.5 p-3.5 rounded-2xl text-xs text-[#29384A]">
                  <span className="font-bold text-[#548BCB]">Support Update: </span>
                  {ticket.adminNote}
                </div>
              )}

              <p className="text-xs text-[#5B6C82] mt-3 tabular-nums">
                Submitted {formatDate(ticket.createdAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
