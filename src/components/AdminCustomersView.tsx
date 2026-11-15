import { useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, Search, Ticket, Users } from 'lucide-react';
import { SupportTicket, TicketStatus } from '../types';

export interface AdminCustomerRecord {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  isDemo: boolean;
}

interface AdminCustomersViewProps {
  tickets: SupportTicket[];
  searchQueryExternal?: string;
  authHeadersBuilder: () => Record<string, string>;
  onViewTickets: () => void;
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

export function AdminCustomersView({
  tickets,
  searchQueryExternal = '',
  authHeadersBuilder,
  onViewTickets,
}: AdminCustomersViewProps) {
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/customers', {
      credentials: 'include',
      headers: authHeadersBuilder(),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) {
          throw new Error(data?.error || 'Could not load customer directory.');
        }
        setCustomers(Array.isArray(data.customers) ? data.customers : []);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Could not load customers.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authHeadersBuilder]);

  const enrichedCustomers = useMemo(() => {
    const q = (searchQuery || searchQueryExternal).trim().toLowerCase();

    // Combine registered accounts from server with any ticket-only customer names
    const map = new Map<
      string,
      {
        key: string;
        fullName: string;
        email: string;
        createdAt: string;
        isDemo: boolean;
        totalTickets: number;
        openTickets: number;
      }
    >();

    for (const c of customers) {
      const custTickets = tickets.filter(
        (t) =>
          t.userId === c.id ||
          (t.customerEmail && t.customerEmail.toLowerCase() === c.email.toLowerCase())
      );
      map.set(c.email.toLowerCase(), {
        key: c.id,
        fullName: c.fullName,
        email: c.email,
        createdAt: c.createdAt,
        isDemo: c.isDemo,
        totalTickets: custTickets.length,
        openTickets: custTickets.filter((t) => t.status !== TicketStatus.RESOLVED).length,
      });
    }

    const list = Array.from(map.values());
    if (!q) return list;
    return list.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [customers, tickets, searchQuery, searchQueryExternal]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#20283B]">
            Customers
          </h2>
          <p className="text-sm text-[#78849B] mt-1">
            View registered customer accounts and their active support ticket volume.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewTickets}
          className="saas-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#5486EA] rounded-xl whitespace-nowrap self-start sm:self-auto"
        >
          <Ticket className="w-4 h-4" aria-hidden="true" />
          <span>View Ticket Queue</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="saas-card rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-[#78849B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name or email..."
            className="saas-input w-full pl-10 pr-4 py-2 text-sm rounded-xl"
          />
        </div>
        <span className="text-xs font-semibold text-[#78849B] tabular-nums whitespace-nowrap">
          {enrichedCustomers.length} Customer{enrichedCustomers.length === 1 ? '' : 's'}
        </span>
      </div>

      {isLoading ? (
        <div className="saas-card rounded-3xl p-10 flex items-center justify-center gap-2 text-sm text-[#78849B]">
          <Loader2 className="w-4 h-4 animate-spin text-[#5486EA]" aria-hidden="true" />
          <span>Loading customer directory...</span>
        </div>
      ) : errorMsg ? (
        <div role="alert" className="bg-[#FDEEEF] border border-[#FAD5D8] text-[#C8434D] rounded-2xl p-4 text-sm">
          {errorMsg}
        </div>
      ) : enrichedCustomers.length === 0 ? (
        <div className="saas-card rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF3FE] text-[#5486EA] flex items-center justify-center mx-auto">
            <Users className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-[#20283B]">No matching customers</h3>
          <p className="text-sm text-[#78849B]">
            Try clearing your search filter or register a new customer account.
          </p>
        </div>
      ) : (
        <div className="saas-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F9FD] text-xs font-semibold text-[#78849B] border-b border-[#EDF1FA]">
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Email</th>
                  <th className="py-3.5 px-5">Account Type</th>
                  <th className="py-3.5 px-5 text-right">Total Tickets</th>
                  <th className="py-3.5 px-5 text-right">Active Tickets</th>
                  <th className="py-3.5 px-5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1FA] text-sm">
                {enrichedCustomers.map((c) => (
                  <tr key={c.key} className="hover:bg-[#F7F9FE] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#20283B] whitespace-nowrap">
                      {c.fullName}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#78849B] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#5486EA]" aria-hidden="true" />
                        <span>{c.email}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#78849B] whitespace-nowrap">
                      {c.isDemo ? 'Demo Account' : 'Registered Customer'}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-semibold text-[#20283B] tabular-nums">
                      {c.totalTickets}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-semibold text-[#5486EA] tabular-nums">
                      {c.openTickets}
                    </td>
                    <td className="py-3.5 px-5 text-right text-xs text-[#78849B] tabular-nums whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
