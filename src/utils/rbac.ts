import { ActiveView, AuthUser, UserRole } from '../types';

export interface NavItem {
  id: ActiveView;
  label: string;
}

export const CUSTOMER_NAV_ITEMS: NavItem[] = [
  { id: 'chat', label: 'Customer Chat' },
  { id: 'tickets', label: 'My Tickets' },
  { id: 'profile', label: 'My Profile' },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'admin', label: 'Overview' },
  { id: 'tickets', label: 'Ticket Management' },
  { id: 'knowledge', label: 'Knowledge Base' },
  { id: 'customers', label: 'Customers' },
  { id: 'settings', label: 'Settings' },
];

const CUSTOMER_ALLOWED_VIEWS = new Set<ActiveView>(['chat', 'tickets', 'profile']);
const ADMIN_ALLOWED_VIEWS = new Set<ActiveView>([
  'admin',
  'tickets',
  'knowledge',
  'customers',
  'settings',
]);
const KNOWN_VIEWS = new Set<ActiveView>([
  'chat',
  'tickets',
  'profile',
  'admin',
  'knowledge',
  'customers',
  'settings',
]);

export function getAllowedNavItems(role: UserRole): NavItem[] {
  return role === UserRole.ADMIN ? ADMIN_NAV_ITEMS : CUSTOMER_NAV_ITEMS;
}

export function getDefaultViewForRole(role: UserRole): ActiveView {
  return role === UserRole.ADMIN ? 'admin' : 'chat';
}

export function canAccessView(user: AuthUser | null, view: ActiveView): boolean {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) {
    return ADMIN_ALLOWED_VIEWS.has(view);
  }
  if (user.role === UserRole.CUSTOMER) {
    return CUSTOMER_ALLOWED_VIEWS.has(view);
  }
  return false;
}

export function getDeniedReason(user: AuthUser | null, view: ActiveView): string {
  if (!user) {
    return 'Authentication required. Please sign in to access TechCare DeskPilot.';
  }
  if (
    user.role === UserRole.CUSTOMER &&
    (view === 'admin' || view === 'knowledge' || view === 'customers' || view === 'settings')
  ) {
    return 'Access denied. Administrator permissions are required to view this page.';
  }
  if (user.role === UserRole.ADMIN && (view === 'chat' || view === 'profile')) {
    return 'Access denied. This page is restricted to customer accounts.';
  }
  return 'Access denied. You do not have permission to view this section.';
}

export function parseRequestedViewFromLocation(): ActiveView | null {
  if (typeof window === 'undefined') return null;

  const hashSegment = window.location.hash
    .replace(/^#\/?/, '')
    .split(/[?#]/)[0]
    .trim()
    .toLowerCase();

  if (KNOWN_VIEWS.has(hashSegment as ActiveView)) {
    return hashSegment as ActiveView;
  }

  const pathSegment = window.location.pathname
    .replace(/^\/+/, '')
    .split('/')[0]
    .trim()
    .toLowerCase();

  if (KNOWN_VIEWS.has(pathSegment as ActiveView)) {
    return pathSegment as ActiveView;
  }

  return null;
}

export function syncLocationHash(view: ActiveView): void {
  if (typeof window === 'undefined') return;
  const targetHash = `#${view}`;
  if (window.location.hash !== targetHash) {
    window.history.replaceState(null, '', targetHash);
  }
}
