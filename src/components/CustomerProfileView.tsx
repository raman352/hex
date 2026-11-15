import {
  CheckCircle2,
  Clock,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  ShieldCheck,
  Ticket,
  User,
} from 'lucide-react';
import { ActiveView, AuthUser, SupportTicket, TicketStatus } from '../types';

interface CustomerProfileViewProps {
  currentUser: AuthUser;
  tickets: SupportTicket[];
  onNavigate: (view: ActiveView) => void;
  onOpenNewTicket: () => void;
  onLogout: () => void;
}

export function CustomerProfileView({
  currentUser,
  tickets,
  onNavigate,
  onOpenNewTicket,
  onLogout,
}: CustomerProfileViewProps) {
  const openCount = tickets.filter((t) => t.status === TicketStatus.OPEN).length;
  const inProgressCount = tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length;
  const resolvedCount = tickets.filter((t) => t.status === TicketStatus.RESOLVED).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#20283B]">My Profile</h1>
        <p className="text-sm text-[#78849B] mt-1">
          View your TechCare customer account details and support summary.
        </p>
      </div>

      {/* Account Card */}
      <section className="saas-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5486EA] to-[#8B72E8] text-white flex items-center justify-center shadow-[0_10px_24px_rgba(84,134,234,0.28)] shrink-0">
            <User className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-1 min-w-0">
            <h2 className="text-xl font-bold text-[#20283B] truncate">
              {currentUser.fullName}
            </h2>
            <p className="text-sm text-[#78849B] inline-flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-[#5486EA] shrink-0" aria-hidden="true" />
              <span>{currentUser.email}</span>
            </p>
            <p className="text-xs text-[#78849B] inline-flex items-center gap-1.5 block">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22B983] shrink-0" aria-hidden="true" />
              <span>Verified Customer Account</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="saas-btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#EF747C] rounded-xl whitespace-nowrap shrink-0"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </section>

      {/* Support Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-[#EEF3FE] to-[#F7F9FF] border border-[#DCE6FB]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5486EA]">
            <span>Open Tickets</span>
            <Ticket className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="text-3xl font-bold text-[#20283B] mt-3 tabular-nums">{openCount}</p>
        </div>

        <div className="rounded-2xl p-5 bg-gradient-to-br from-[#FFF6EB] to-[#FFFBF5] border border-[#FBE5C8]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#B86F14]">
            <span>In Progress</span>
            <Clock className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="text-3xl font-bold text-[#20283B] mt-3 tabular-nums">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-2xl p-5 bg-gradient-to-br from-[#EAF9F3] to-[#F4FCF8] border border-[#CBEFE0]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#17875E]">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="text-3xl font-bold text-[#20283B] mt-3 tabular-nums">{resolvedCount}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="saas-card rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-[#20283B]">Quick Support Actions</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('chat')}
            className="saas-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span>Open Customer Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('tickets')}
            className="saas-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl"
          >
            <Ticket className="w-4 h-4 text-[#5486EA]" aria-hidden="true" />
            <span>View My Tickets ({tickets.length})</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewTicket}
            className="saas-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl"
          >
            <Plus className="w-4 h-4 text-[#8B72E8]" aria-hidden="true" />
            <span>Raise New Ticket</span>
          </button>
        </div>
      </section>
    </div>
  );
}
