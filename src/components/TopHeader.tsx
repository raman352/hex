import { useEffect, useRef, useState } from 'react';
import { Bell, LogOut, Menu, Plus, Search } from 'lucide-react';
import { ActiveView, AuthUser, SupportTicket, TicketStatus, UserRole } from '../types';

interface TopHeaderProps {
  currentUser: AuthUser;
  activeView: ActiveView;
  tickets: SupportTicket[];
  globalSearch?: string;
  onGlobalSearchChange?: (val: string) => void;
  onOpenMobileSidebar: () => void;
  onOpenNewTicket: () => void;
  onNavigate: (view: ActiveView) => void;
  onLogout: () => void;
}

const VIEW_TITLES: Record<ActiveView, string> = {
  chat: 'Customer Support Chat',
  tickets: 'Support Tickets',
  profile: 'My Profile',
  admin: 'Admin Overview',
  knowledge: 'Knowledge Base',
  customers: 'Customers',
  settings: 'Workspace Settings',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function TopHeader({
  currentUser,
  activeView,
  tickets,
  globalSearch,
  onGlobalSearchChange,
  onOpenMobileSidebar,
  onOpenNewTicket,
  onNavigate,
  onLogout,
}: TopHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const pageTitle =
    activeView === 'tickets'
      ? isAdmin
        ? 'Ticket Management'
        : 'My Tickets'
      : VIEW_TITLES[activeView];

  const firstName = currentUser.fullName.split(' ')[0] || currentUser.fullName;
  const showSearch =
    onGlobalSearchChange !== undefined &&
    (activeView === 'tickets' ||
      activeView === 'knowledge' ||
      activeView === 'customers' ||
      activeView === 'admin');

  const activeAlerts = tickets.filter((t) => t.status !== TicketStatus.RESOLVED).slice(0, 5);

  useEffect(() => {
    if (!notifOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [notifOpen]);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/85 backdrop-blur-md border-b border-[#E6EBF5]">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Hamburger + Page Title & Short Greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden w-10 h-10 rounded-xl border border-[#E6EBF5] bg-white flex items-center justify-center text-[#20283B] hover:bg-[#F4F6FC] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-[#20283B] truncate leading-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-[#78849B] truncate">
              {getGreeting()}, {firstName}
            </p>
          </div>
        </div>

        {/* Right: Contextual Search, Notifications, Primary CTA, Profile & Logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          {showSearch && (
            <div className="hidden md:block relative w-56 xl:w-64">
              <Search
                className="w-4 h-4 text-[#78849B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={globalSearch ?? ''}
                onChange={(e) => onGlobalSearchChange(e.target.value)}
                placeholder={`Search ${pageTitle.toLowerCase()}...`}
                aria-label={`Search ${pageTitle}`}
                className="saas-input w-full pl-9 pr-3 py-1.5 text-xs rounded-xl"
              />
            </div>
          )}

          {/* Live Ticket Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="View ticket notifications"
              aria-expanded={notifOpen}
              className="relative w-10 h-10 rounded-xl border border-[#E6EBF5] bg-white hover:bg-[#F4F6FC] flex items-center justify-center text-[#5A667E] hover:text-[#20283B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
            >
              <Bell className="w-[18px] h-[18px]" aria-hidden="true" />
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#5486EA] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                role="dialog"
                aria-label="Recent ticket activity"
                className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-[#E6EBF5] shadow-[0_16px_40px_rgba(32,40,59,0.12)] p-3 space-y-2 z-40"
              >
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#20283B]">
                    Active Ticket Updates
                  </span>
                  <span className="text-xs text-[#78849B] tabular-nums">
                    {activeAlerts.length} pending
                  </span>
                </div>

                {activeAlerts.length === 0 ? (
                  <p className="px-2 py-4 text-xs text-[#78849B] text-center">
                    All support tickets are currently resolved.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {activeAlerts.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          onNavigate(isAdmin ? 'tickets' : 'tickets');
                        }}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-[#F4F6FC] transition-colors space-y-0.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono font-semibold text-[#5486EA] tabular-nums">
                            {t.id}
                          </span>
                          <span className="text-[#78849B]">{t.status}</span>
                        </div>
                        <p className="text-xs font-medium text-[#20283B] truncate">
                          {t.customerName} · {t.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenNewTicket}
            className="saas-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">New Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate(isAdmin ? 'settings' : 'profile')}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[#E6EBF5] bg-white hover:bg-[#F4F6FC] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
          >
            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#5486EA] to-[#8B72E8] text-white text-[11px] font-bold flex items-center justify-center">
              {firstName.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-xs font-semibold text-[#20283B] max-w-[100px] truncate">
              {firstName}
            </span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            title="Sign Out"
            aria-label="Sign Out"
            className="w-9 h-9 rounded-xl border border-[#E6EBF5] bg-white hover:bg-[#FFF5F6] hover:text-[#EF747C] text-[#78849B] flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
