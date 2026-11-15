import { useState } from 'react';
import { Headphones, Home, Menu, Plus, X } from 'lucide-react';
import { ActiveView, AuthUser, UserRole } from '../types';

interface TopNavProps {
  currentUser: AuthUser;
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenNewTicket: () => void;
  onLogout: () => void;
}

const DEMO_NAV_ITEMS: { id: ActiveView; label: string }[] = [
  { id: 'chat', label: 'Customer Chat' },
  { id: 'admin', label: 'Admin Dashboard' },
  { id: 'tickets', label: 'Ticket Management' },
  { id: 'knowledge', label: 'Knowledge Base' },
  { id: 'demo', label: 'Demo Guide' },
];

export function TopNav({
  currentUser,
  activeView,
  onNavigate,
  onOpenNewTicket,
  onLogout,
}: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const homeView: ActiveView =
    currentUser.role === UserRole.ADMIN ? 'admin' : 'chat';

  const handleSelect = (view: ActiveView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 neu-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3 lg:gap-4">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={() => handleSelect(homeView)}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 rounded-xl px-1.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EEF3F9]"
        >
          <span className="neu-btn-primary w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
            <Headphones className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#29384A]">
            TechCare DeskPilot
          </span>
        </button>

        {/* Zone 2: Recessed Navigation Track across all 4 core sections + Guide */}
        <nav
          className="hidden lg:flex items-center gap-1 p-1.5 rounded-2xl neu-inset-sm"
          aria-label="Primary Navigation"
        >
          {DEMO_NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`px-3 py-2 text-xs xl:text-sm font-medium rounded-xl transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB] ${
                  isActive
                    ? 'neu-surface-sm text-[#548BCB] font-semibold'
                    : 'text-[#5B6C82] hover:text-[#29384A]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Demo Context + New Ticket + Return to Demo Home */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden xl:block text-right pr-1">
            <p className="text-xs font-bold text-[#29384A] truncate max-w-[140px]">
              {currentUser.fullName}
            </p>
            <p className="text-[11px] text-[#5B6C82]">
              {currentUser.role === UserRole.ADMIN ? 'Admin Demo' : 'Customer Demo'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNewTicket}
            className="neu-btn-primary inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">New Ticket</span>
            <span className="sm:hidden">Ticket</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            title="Return to Demo Access Home"
            className="neu-btn inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#5B6C82] hover:text-[#29384A] rounded-xl whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
          >
            <Home className="w-3.5 h-3.5 text-[#548BCB]" aria-hidden="true" />
            <span className="hidden sm:inline">Demo Home</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden neu-btn inline-flex items-center justify-center w-10 h-10 rounded-xl text-[#29384A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          className="lg:hidden px-4 pb-4 pt-2 space-y-2 bg-[#EEF3F9]"
          aria-label="Mobile Navigation"
        >
          <div className="neu-inset rounded-2xl p-2 space-y-1.5">
            <div className="px-3 py-2 text-xs text-[#5B6C82]">
              Demonstration Mode: <strong className="text-[#29384A]">{currentUser.fullName}</strong> (
              {currentUser.role === UserRole.ADMIN ? 'Admin Demo' : 'Customer Demo'})
            </div>
            {DEMO_NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB] ${
                    isActive
                      ? 'neu-surface-sm text-[#548BCB] font-semibold'
                      : 'text-[#5B6C82] hover:text-[#29384A]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-[#548BCB] flex items-center gap-2 min-h-[44px]"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>Return to Demo Home</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
