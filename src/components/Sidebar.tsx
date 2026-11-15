import {
  BookOpen,
  ClipboardList,
  Headphones,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Ticket,
  User,
  Users,
  X,
} from 'lucide-react';
import { ActiveView, AuthUser, UserRole } from '../types';
import { getAllowedNavItems, getDefaultViewForRole } from '../utils/rbac';

interface SidebarProps {
  currentUser: AuthUser;
  activeView: ActiveView;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigate: (view: ActiveView) => void;
  onLogout: () => void;
}

const VIEW_ICONS: Record<ActiveView, typeof MessageSquare> = {
  chat: MessageSquare,
  tickets: Ticket,
  profile: User,
  admin: LayoutDashboard,
  knowledge: BookOpen,
  customers: Users,
  settings: Settings,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Sidebar({
  currentUser,
  activeView,
  mobileOpen,
  onCloseMobile,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const navItems = getAllowedNavItems(currentUser.role);
  const homeView = getDefaultViewForRole(currentUser.role);
  const roleLabel = isAdmin ? 'Administrator' : 'Customer';

  const handleSelect = (view: ActiveView) => {
    onNavigate(view);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-md border-r border-[#E6EBF5]">
      {/* Brand Lockup */}
      <div className="px-5 h-16 flex items-center justify-between border-b border-[#EDF1FA] shrink-0">
        <button
          type="button"
          onClick={() => handleSelect(homeView)}
          className="flex items-center gap-2.5 text-left whitespace-nowrap rounded-xl py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5486EA] to-[#8B72E8] text-white flex items-center justify-center shadow-[0_6px_14px_rgba(84,134,234,0.28)] shrink-0">
            <Headphones className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="font-display text-[17px] font-bold tracking-tight text-[#20283B]">
            TechCare <span className="text-[#5486EA]">DeskPilot</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#78849B] hover:text-[#20283B] hover:bg-[#F4F6FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        <div className="space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold text-[#78849B]">
            {isAdmin ? 'Admin Workspace' : 'Support Menu'}
          </p>
          <nav className="space-y-1" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const Icon =
                item.id === 'tickets' && isAdmin ? ClipboardList : VIEW_ICONS[item.id];
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA] ${
                    isActive
                      ? 'bg-gradient-to-r from-[#EEF3FE] to-[#F3EEFE] text-[#5486EA] font-semibold shadow-[inset_0_0_0_1px_rgba(84,134,234,0.16)]'
                      : 'text-[#5A667E] font-medium hover:bg-[#F4F6FC] hover:text-[#20283B]'
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-[#5486EA]' : 'text-[#78849B]'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom User Profile & Sign Out */}
      <div className="p-3.5 border-t border-[#EDF1FA] space-y-2.5 shrink-0">
        <button
          type="button"
          onClick={() => handleSelect(isAdmin ? 'settings' : 'profile')}
          className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-[#F4F6FC] hover:bg-[#EDF1FA] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5486EA] to-[#8B72E8] text-white text-xs font-bold flex items-center justify-center shrink-0">
            {getInitials(currentUser.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#20283B] truncate">
              {currentUser.fullName}
            </p>
            <p className="text-xs text-[#78849B] truncate">{roleLabel}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onLogout();
          }}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#5A667E] hover:text-[#EF747C] hover:bg-[#FFF5F6] border border-[#E6EBF5] transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (~252px) */}
      <aside className="hidden lg:block w-[252px] shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Slide-Over Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#20283B]/30 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-[264px] max-w-[82vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
