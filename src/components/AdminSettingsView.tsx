import { useState } from 'react';
import {
  CheckCircle2,
  Database,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { DEMO_ORDERS, DEMO_POLICIES, DEMO_PRODUCTS } from '../data/demoData';
import { ActiveView, AuthUser } from '../types';

interface AdminSettingsViewProps {
  currentUser: AuthUser;
  onResetDemoData: () => void;
  onNavigate: (view: ActiveView) => void;
}

export function AdminSettingsView({
  currentUser,
  onResetDemoData,
  onNavigate,
}: AdminSettingsViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = () => {
    onResetDemoData();
    setConfirmReset(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#20283B]">
            Workspace Settings
          </h2>
          <p className="text-sm text-[#78849B] mt-1">
            Manage administrator configuration, demo catalog reference, and local storage reset controls.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {resetDone && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF9F3] border border-[#CBEFE0] text-[#17875E] text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Demo data restored</span>
            </span>
          )}

          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="saas-btn-danger px-3.5 py-2 text-xs font-semibold rounded-xl"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="saas-btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="saas-btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4 text-[#5486EA]" aria-hidden="true" />
              <span>Reset Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Administrator Session Card */}
      <section className="saas-card rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F2EEFD] text-[#8B72E8] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#20283B]">
              {currentUser.fullName}
            </h3>
            <p className="text-xs text-[#78849B]">
              {currentUser.email} · Server-Verified Administrator
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="saas-btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => onNavigate('knowledge')}
            className="saas-btn-primary px-3.5 py-2 text-xs font-semibold rounded-xl"
          >
            Manage FAQs
          </button>
        </div>
      </section>

      {/* Demo Products & Demo Orders Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="saas-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#20283B] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#5486EA]" aria-hidden="true" />
              <span>Demo Product Catalog</span>
            </h3>
            <span className="text-xs text-[#78849B]">AI Reference</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#EDF1FA]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F9FD] border-b border-[#EDF1FA] text-xs font-semibold text-[#78849B]">
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4 text-right">Price</th>
                  <th className="py-2.5 px-4 text-right">Warranty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1FA] text-xs">
                {DEMO_PRODUCTS.map((p) => (
                  <tr key={p.sku}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#20283B]">{p.name}</p>
                      <p className="text-[#78849B] mt-0.5">{p.highlights}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#20283B] whitespace-nowrap">
                      ₹{p.priceInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#78849B] whitespace-nowrap">
                      {p.warrantyMonths} mo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="saas-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#20283B]">Demo Orders</h3>
            <span className="text-xs text-[#78849B]">Sample Tracking Data</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#EDF1FA]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F9FD] border-b border-[#EDF1FA] text-xs font-semibold text-[#78849B]">
                  <th className="py-2.5 px-4">Order ID</th>
                  <th className="py-2.5 px-4">Customer &amp; Item</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1FA] text-xs">
                {DEMO_ORDERS.map((o) => (
                  <tr key={o.orderId}>
                    <td className="py-3 px-4 font-mono font-semibold text-[#20283B] tabular-nums whitespace-nowrap">
                      {o.orderId}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#20283B]">{o.customerName}</p>
                      <p className="text-[#78849B] mt-0.5">{o.productName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#5486EA]">{o.status}</p>
                      <p className="text-[#78849B] mt-0.5">{o.estimatedDelivery}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Policy Grounding Reference */}
      <section className="saas-card rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-[#20283B]">
          AI Grounding Policy Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_POLICIES.map((pol) => (
            <div
              key={pol.id}
              className="p-4 rounded-2xl bg-[#F7F9FD] border border-[#EDF1FA] space-y-2"
            >
              <h4 className="text-sm font-semibold text-[#20283B]">{pol.title}</h4>
              <p className="text-xs text-[#5486EA] font-medium">{pol.summary}</p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#78849B]">
                {pol.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
