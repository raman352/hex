import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
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
  searchQueryExternal?: string;
  onUpdateTicket: (
    ticketId: string,
    updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'adminNote'>>
  ) => void;
  onDeleteTicket: (ticketId: string) => void;
  onOpenKnowledgeBase?: () => void;
  onOpenTicketManagement?: () => void;
}

type DateRangeKey = 'all' | '24h' | '7d' | '30d';

const CATEGORY_COLORS = [
  '#5486EA',
  '#8B72E8',
  '#22B983',
  '#F4AE54',
  '#EF747C',
  '#A594F9',
];

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
  searchQueryExternal = '',
  onUpdateTicket,
  onDeleteTicket,
  onOpenKnowledgeBase,
  onOpenTicketManagement,
}: AdminDashboardViewProps) {
  const [dateRange, setDateRange] = useState<DateRangeKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TicketPriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TicketCategory>('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const effectiveSearch = (searchQuery || searchQueryExternal).trim().toLowerCase();

  const dateFilteredTickets = useMemo(() => {
    if (dateRange === 'all') return tickets;
    const now = Date.now();
    const windowMs =
      dateRange === '24h'
        ? 24 * 60 * 60 * 1000
        : dateRange === '7d'
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;

    return tickets.filter((t) => {
      const ts = Date.parse(t.createdAt);
      if (Number.isNaN(ts)) return true;
      return now - ts <= windowMs;
    });
  }, [tickets, dateRange]);

  const metrics = useMemo(() => {
    const total = dateFilteredTickets.length;
    const open = dateFilteredTickets.filter((t) => t.status === TicketStatus.OPEN).length;
    const inProgress = dateFilteredTickets.filter(
      (t) => t.status === TicketStatus.IN_PROGRESS
    ).length;
    const resolved = dateFilteredTickets.filter(
      (t) => t.status === TicketStatus.RESOLVED
    ).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { total, open, inProgress, resolved, resolutionRate };
  }, [dateFilteredTickets]);

  const categoryBreakdown = useMemo(() => {
    const categories = Object.values(TicketCategory);
    return categories.map((cat, index) => ({
      category: cat,
      shortLabel: cat.split(' & ')[0].split(' ')[0],
      count: dateFilteredTickets.filter((t) => t.category === cat).length,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [dateFilteredTickets]);

  const maxCategoryCount = Math.max(
    1,
    ...categoryBreakdown.map((item) => item.count)
  );

  const priorityBreakdown = useMemo(() => {
    const items: { priority: TicketPriority; color: string; bg: string }[] = [
      { priority: TicketPriority.URGENT, color: '#EF747C', bg: 'bg-[#FDEEEF]' },
      { priority: TicketPriority.HIGH, color: '#F4AE54', bg: 'bg-[#FFF6EB]' },
      { priority: TicketPriority.MEDIUM, color: '#8B72E8', bg: 'bg-[#F2EEFD]' },
      { priority: TicketPriority.LOW, color: '#5486EA', bg: 'bg-[#EEF3FE]' },
    ];
    return items.map((item) => ({
      ...item,
      count: dateFilteredTickets.filter((t) => t.priority === item.priority).length,
    }));
  }, [dateFilteredTickets]);

  const filteredTickets = useMemo(() => {
    return dateFilteredTickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (!effectiveSearch) return true;
      return (
        t.id.toLowerCase().includes(effectiveSearch) ||
        t.customerName.toLowerCase().includes(effectiveSearch) ||
        t.orderId.toLowerCase().includes(effectiveSearch) ||
        t.description.toLowerCase().includes(effectiveSearch)
      );
    });
  }, [
    dateFilteredTickets,
    effectiveSearch,
    statusFilter,
    priorityFilter,
    categoryFilter,
  ]);

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
      if (e.key === 'Escape') closeInspector();
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
    setDateRange('all');
  };

  // SVG Donut math for Tickets by Status
  const donutRadius = 52;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const statusSegments = useMemo(() => {
    const total = metrics.total;
    if (total === 0) return [];
    const raw = [
      { label: 'Open', count: metrics.open, color: '#5486EA' },
      { label: 'In Progress', count: metrics.inProgress, color: '#F4AE54' },
      { label: 'Resolved', count: metrics.resolved, color: '#22B983' },
    ];
    let offset = 0;
    return raw
      .filter((s) => s.count > 0)
      .map((s) => {
        const length = (s.count / total) * donutCircumference;
        const segment = {
          ...s,
          dashArray: `${length} ${donutCircumference - length}`,
          dashOffset: -offset,
          pct: Math.round((s.count / total) * 100),
        };
        offset += length;
        return segment;
      });
  }, [metrics, donutCircumference]);

  return (
    <div className="space-y-6">
      {/* Quick Overview Banner + 4 Pastel Gradient Stat Cards (Reference Image 2) */}
      <section className="admin-overview-banner rounded-3xl border border-[#E2E8F5] p-5 sm:p-7 shadow-[0_10px_34px_rgba(32,40,59,0.04)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[28px] font-bold tracking-tight text-[#20283B] leading-tight">
              Quick Overview
            </h2>
            <p className="text-sm text-[#78849B] mt-1">
              Live helpdesk performance, ticket distribution, and priority triage across TechCare.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 bg-white/90 border border-[#E1E7F4] rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-[#5486EA]" aria-hidden="true" />
              <select
                aria-label="Filter dashboard by date range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeKey)}
                className="bg-transparent text-xs font-semibold text-[#20283B] focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {onOpenKnowledgeBase && (
              <button
                type="button"
                onClick={onOpenKnowledgeBase}
                className="saas-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#5486EA] rounded-xl whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>Knowledge Base</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Pastel Gradient Statistic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#F1EDFF] to-[#FAF8FF] border border-[#E5DDFD] shadow-[0_6px_18px_rgba(139,114,232,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#694EC9]">Total Tickets</span>
              <span className="w-9 h-9 rounded-xl bg-white/90 text-[#8B72E8] flex items-center justify-center shadow-xs">
                <Inbox className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-3xl font-bold text-[#20283B] mt-3 tabular-nums">
              {metrics.total}
            </p>
            <p className="text-xs text-[#78849B] mt-1">All recorded support requests</p>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#EAF2FF] to-[#F6F9FF] border border-[#D7E5FD] shadow-[0_6px_18px_rgba(84,134,234,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#3B6FD4]">Open Tickets</span>
              <span className="w-9 h-9 rounded-xl bg-white/90 text-[#5486EA] flex items-center justify-center shadow-xs">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-3xl font-bold text-[#20283B] mt-3 tabular-nums">
              {metrics.open}
            </p>
            <p className="text-xs text-[#78849B] mt-1">Awaiting initial review</p>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#FFF4E5] to-[#FFFBF5] border border-[#FBE3C4] shadow-[0_6px_18px_rgba(244,174,84,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#B86F14]">In Progress</span>
              <span className="w-9 h-9 rounded-xl bg-white/90 text-[#F4AE54] flex items-center justify-center shadow-xs">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-3xl font-bold text-[#20283B] mt-3 tabular-nums">
              {metrics.inProgress}
            </p>
            <p className="text-xs text-[#78849B] mt-1">Actively handled by agents</p>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#E8FAF2] to-[#F5FCF9] border border-[#C9EEDF] shadow-[0_6px_18px_rgba(34,185,131,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#17875E]">Resolved Tickets</span>
              <span className="w-9 h-9 rounded-xl bg-white/90 text-[#22B983] flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-3xl font-bold text-[#20283B] mt-3 tabular-nums">
              {metrics.resolved}
            </p>
            <p className="text-xs text-[#78849B] mt-1">
              {metrics.resolutionRate}% resolution rate
            </p>
          </div>
        </div>
      </section>

      {/* Analytics Charts Grid (100% live values from application ticket data) */}
      <section aria-label="Ticket Analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Tickets by Status Donut */}
        <div className="saas-card rounded-3xl p-6 flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-base font-semibold text-[#20283B]">Tickets by Status</h3>
            <p className="text-xs text-[#78849B] mt-0.5">Current workflow distribution</p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle
                  cx="70"
                  cy="70"
                  r={donutRadius}
                  fill="none"
                  stroke="#EDF1FA"
                  strokeWidth="16"
                />
                {statusSegments.map((seg) => (
                  <circle
                    key={seg.label}
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-[#20283B] tabular-nums">
                  {metrics.total}
                </span>
                <span className="text-[11px] font-medium text-[#78849B]">Tickets</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 text-xs">
              {[
                { label: 'Open', count: metrics.open, color: '#5486EA' },
                { label: 'In Progress', count: metrics.inProgress, color: '#F4AE54' },
                { label: 'Resolved', count: metrics.resolved, color: '#22B983' },
              ].map((row) => {
                const pct =
                  metrics.total > 0 ? Math.round((row.count / metrics.total) * 100) : 0;
                return (
                  <div key={row.label} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-[#20283B] font-medium">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <span>{row.label}</span>
                    </span>
                    <span className="font-mono font-semibold text-[#20283B] tabular-nums">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: Tickets by Category (Colourful Rounded Bar Chart) */}
        <div className="saas-card rounded-3xl p-6 flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-base font-semibold text-[#20283B]">Tickets by Category</h3>
            <p className="text-xs text-[#78849B] mt-0.5">Volume across support topics</p>
          </div>

          <div className="h-40 flex items-end justify-between gap-2.5 pt-2">
            {categoryBreakdown.map((item) => {
              const heightPct = Math.max(
                item.count > 0 ? 18 : 6,
                Math.round((item.count / maxCategoryCount) * 100)
              );
              return (
                <div
                  key={item.category}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 min-w-0"
                  title={`${item.category}: ${item.count}`}
                >
                  <span className="text-xs font-mono font-semibold text-[#20283B] tabular-nums">
                    {item.count}
                  </span>
                  <div className="w-full max-w-[34px] flex-1 bg-[#F4F6FC] rounded-full p-1 flex items-end">
                    <div
                      className="w-full rounded-full transition-all duration-300"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#78849B] truncate w-full text-center">
                    {item.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Tickets by Priority & Resolution Progress */}
        <div className="saas-card rounded-3xl p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#20283B]">
                Priority &amp; Resolution
              </h3>
              <p className="text-xs text-[#78849B] mt-0.5">Urgency mix and closure rate</p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-[#EAF9F3] text-[#17875E] text-xs font-bold tabular-nums">
              {metrics.resolutionRate}% Solved
            </span>
          </div>

          <div className="space-y-3">
            {priorityBreakdown.map((item) => {
              const widthPct =
                metrics.total > 0 ? Math.round((item.count / metrics.total) * 100) : 0;
              return (
                <div key={item.priority} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#20283B]">{item.priority}</span>
                    <span className="font-mono text-[#78849B] tabular-nums">
                      {item.count} ({widthPct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EDF1FA] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Tickets Section */}
      <section className="saas-card rounded-3xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#EDF1FA] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#20283B]">Recent Tickets</h3>
              <p className="text-xs text-[#78849B] mt-0.5">
                Inspect customer complaints, update statuses, or add resolution notes.
              </p>
            </div>
            {onOpenTicketManagement && (
              <button
                type="button"
                onClick={onOpenTicketManagement}
                className="saas-btn-secondary px-3.5 py-2 text-xs font-semibold text-[#5486EA] rounded-xl whitespace-nowrap self-start sm:self-auto"
              >
                Open Full Ticket Table
              </button>
            )}
          </div>

          {/* Search & Filters */}
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
                placeholder="Search ticket ID, customer, order ID..."
                className="saas-input w-full pl-10 pr-4 py-2 text-sm rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="bg-[#F4F6FC] border border-[#E6EBF5] flex items-center gap-1 p-1 rounded-xl overflow-x-auto max-w-full">
                {(['ALL', TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED] as const).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                        statusFilter === st
                          ? 'bg-white text-[#5486EA] shadow-xs'
                          : 'text-[#78849B] hover:text-[#20283B]'
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

        {filteredTickets.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF3FE] text-[#5486EA] flex items-center justify-center mx-auto">
              <Inbox className="w-5 h-5" aria-hidden="true" />
            </div>
            <h4 className="text-base font-semibold text-[#20283B]">
              {tickets.length === 0
                ? 'No support tickets recorded yet'
                : 'No tickets match your filters'}
            </h4>
            <p className="text-sm text-[#78849B] max-w-md mx-auto">
              {tickets.length === 0
                ? 'Customer support tickets submitted from chat or the ticket modal will appear here.'
                : 'Adjust your search, date range, or filter selections to see matching tickets.'}
            </p>
            {(effectiveSearch ||
              statusFilter !== 'ALL' ||
              priorityFilter !== 'ALL' ||
              categoryFilter !== 'ALL' ||
              dateRange !== 'all') && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="saas-btn-secondary px-4 py-2 text-xs font-semibold text-[#5486EA] rounded-xl"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F9FD] text-xs font-semibold text-[#78849B] border-b border-[#EDF1FA]">
                    <th className="py-3 px-4 whitespace-nowrap">Ticket ID</th>
                    <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                    <th className="py-3 px-4 whitespace-nowrap">Category</th>
                    <th className="py-3 px-4">Complaint Summary</th>
                    <th className="py-3 px-4 whitespace-nowrap">Priority</th>
                    <th className="py-3 px-4 whitespace-nowrap">Date Created</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
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
                          {ticket.orderId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#78849B] whitespace-nowrap">
                        {ticket.category}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#20283B] max-w-xs">
                        <p className="line-clamp-2">{ticket.description}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityLabel priority={ticket.priority} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#78849B] tabular-nums whitespace-nowrap">
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
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openInspector(ticket)}
                          className="saas-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5486EA] rounded-xl"
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
                    <select
                      aria-label={`Change status for ${ticket.id}`}
                      value={ticket.status}
                      onChange={(e) =>
                        onUpdateTicket(ticket.id, {
                          status: e.target.value as TicketStatus,
                        })
                      }
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border ${
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

                    <button
                      type="button"
                      onClick={() => openInspector(ticket)}
                      className="saas-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5486EA] rounded-xl"
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
      </section>

      {/* Ticket Detail Inspector Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#20283B]/35 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspector-title"
        >
          <div className="bg-white rounded-3xl border border-[#E6EBF5] shadow-[0_24px_60px_rgba(32,40,59,0.18)] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[#EDF1FA] flex items-center justify-between shrink-0">
              <div>
                <h2
                  id="inspector-title"
                  className="text-base font-bold text-[#20283B] font-mono tabular-nums"
                >
                  {selectedTicket.id}
                </h2>
                <p className="text-xs text-[#78849B] mt-0.5">
                  {selectedTicket.category} · Created {formatShortDate(selectedTicket.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeInspector}
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

              {matchedDemoOrder && (
                <div className="bg-[#EEF3FE] border border-[#DCE6FB] text-[#3B6FD4] p-4 rounded-2xl text-xs space-y-1">
                  <p className="font-bold">
                    Matched Demo Order Record ({matchedDemoOrder.orderId})
                  </p>
                  <p>
                    {matchedDemoOrder.productName} · Status: {matchedDemoOrder.status}
                  </p>
                  <p>
                    {matchedDemoOrder.carrier} ({matchedDemoOrder.trackingNumber}) ·{' '}
                    {matchedDemoOrder.estimatedDelivery}
                  </p>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-[#78849B] block mb-1.5">
                  Customer Complaint
                </span>
                <p className="bg-[#F7F9FD] border border-[#E6EBF5] text-sm text-[#20283B] p-4 rounded-2xl leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="admin-status-select"
                    className="block text-xs font-semibold text-[#20283B] mb-1.5"
                  >
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
                    htmlFor="admin-priority-select"
                    className="block text-xs font-semibold text-[#20283B] mb-1.5"
                  >
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

              <div>
                <label
                  htmlFor="admin-note-input"
                  className="block text-xs font-semibold text-[#20283B] mb-1.5"
                >
                  Resolution Note (Visible to Customer)
                </label>
                <div className="space-y-3">
                  <textarea
                    id="admin-note-input"
                    rows={3}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add resolution summary, pickup tracking, or follow-up steps..."
                    className="saas-input w-full px-3.5 py-2.5 text-sm rounded-2xl resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <StatusLabel status={selectedTicket.status} />
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="saas-btn-primary px-4 py-2 text-xs font-semibold rounded-xl"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EDF1FA] flex flex-wrap items-center justify-between gap-2">
                {confirmDeleteId === selectedTicket.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[#EF747C] font-semibold">
                      Delete permanently?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteTicket(selectedTicket.id);
                        closeInspector();
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
                )}

                <button
                  type="button"
                  onClick={closeInspector}
                  className="saas-btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
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
