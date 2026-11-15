import { useState } from 'react';
import {
  CheckCircle2,
  Database,
  RotateCcw,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import {
  DEMO_ORDERS,
  DEMO_POLICIES,
  DEMO_PRODUCTS,
} from '../data/demoData';
import { ActiveView } from '../types';

interface DemoDataGuideViewProps {
  onResetDemoData: () => void;
  onNavigate: (view: ActiveView) => void;
}

export function DemoDataGuideView({
  onResetDemoData,
  onNavigate,
}: DemoDataGuideViewProps) {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#29384A]">
            Demo Catalog, Policies & Run Guide
          </h1>
          <p className="text-sm text-[#5B6C82] mt-1">
            Fictional sample data powering TechCare DeskPilot, plus instructions for testing and running locally.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {resetDone && (
            <span className="neu-status-resolved inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Demo data restored</span>
            </span>
          )}
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="neu-btn-danger px-3.5 py-2 text-xs font-semibold rounded-xl"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="neu-btn px-3.5 py-2 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="neu-btn inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
            >
              <RotateCcw className="w-4 h-4 text-[#548BCB]" aria-hidden="true" />
              <span>Reset Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Fictional Data Notice */}
      <div className="neu-surface rounded-3xl p-5 flex items-start gap-3.5">
        <span className="neu-status-open w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5" aria-hidden="true" />
        </span>
        <div className="text-sm text-[#29384A]">
          <p className="font-bold">Fictional Demo Environment Notice</p>
          <p className="text-xs text-[#5B6C82] mt-1 leading-relaxed">
            All customers, order IDs, tracking numbers, products, and policies displayed in TechCare DeskPilot are fictional demo data stored locally in your browser (<code className="font-mono">localStorage</code>). Never enter real passwords, credit/debit card details, or bank account information.
          </p>
        </div>
      </div>

      {/* Sample Products & Sample Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="neu-surface rounded-3xl overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#29384A] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#548BCB]" aria-hidden="true" />
              <span>Demo Products</span>
            </h2>
            <span className="text-xs font-medium text-[#5B6C82]">Fictional Catalog</span>
          </div>
          <div className="neu-inset-sm rounded-2xl overflow-x-auto p-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2DEEC] text-xs font-bold text-[#5B6C82]">
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-4 text-right">Price</th>
                  <th className="py-2.5 px-4 text-right">Warranty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7E2EE] text-xs">
                {DEMO_PRODUCTS.map((p) => (
                  <tr key={p.sku}>
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#29384A]">{p.name}</p>
                      <p className="text-[#5B6C82] mt-0.5">{p.highlights}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#29384A] font-semibold whitespace-nowrap">
                      ₹{p.priceInr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#5B6C82] whitespace-nowrap">
                      {p.warrantyMonths} mo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="neu-surface rounded-3xl overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#29384A]">Demo Orders</h2>
            <span className="text-xs font-medium text-[#5B6C82]">Fictional Customers</span>
          </div>
          <div className="neu-inset-sm rounded-2xl overflow-x-auto p-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D2DEEC] text-xs font-bold text-[#5B6C82]">
                  <th className="py-2.5 px-4">Order ID</th>
                  <th className="py-2.5 px-4">Customer & Item</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7E2EE] text-xs">
                {DEMO_ORDERS.map((o) => (
                  <tr key={o.orderId}>
                    <td className="py-3 px-4 font-mono font-bold text-[#29384A] tabular-nums whitespace-nowrap">
                      {o.orderId}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#29384A]">{o.customerName}</p>
                      <p className="text-[#5B6C82] mt-0.5">{o.productName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#548BCB]">{o.status}</p>
                      <p className="text-[#5B6C82] mt-0.5">{o.estimatedDelivery}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Company Policy Reference */}
      <section className="neu-surface rounded-3xl p-6 space-y-4">
        <h2 className="text-base font-bold text-[#29384A]">
          Demo Company Policies (AI Grounding Reference)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {DEMO_POLICIES.map((pol) => (
            <div key={pol.id} className="neu-surface-bright rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-bold text-[#29384A]">{pol.title}</h3>
              <p className="text-xs text-[#548BCB] font-medium">{pol.summary}</p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#5B6C82]">
                {pol.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* E2E Workflow & Run Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="neu-surface rounded-3xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#29384A]">
            Test the Customer-to-Admin Workflow
          </h2>
          <ol className="list-decimal pl-5 space-y-2.5 text-sm text-[#5B6C82]">
            <li>
              Open{' '}
              <button
                type="button"
                onClick={() => onNavigate('chat')}
                className="text-[#548BCB] font-semibold hover:underline"
              >
                Customer Chat
              </button>{' '}
              and ask a complaint question like <em>&ldquo;My PulseWatch S3 screen is flickering&rdquo;</em> or Hinglish <em>&ldquo;Mera order TC-1042 kab tak deliver hoga?&rdquo;</em>.
            </li>
            <li>
              When DeskPilot detects an unresolved issue, click <strong>Create Support Ticket</strong> inside the reply, review the pre-filled fields, and submit.
            </li>
            <li>
              Switch to{' '}
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="text-[#548BCB] font-semibold hover:underline"
              >
                Admin Dashboard
              </button>
              , locate the new ticket, change its status to <strong>In Progress</strong> or <strong>Resolved</strong>, and add a note.
            </li>
            <li>
              Refresh the browser page and verify that your ticket, status update, and chat history persist in <code className="font-mono text-xs">localStorage</code>, and check{' '}
              <button
                type="button"
                onClick={() => onNavigate('knowledge')}
                className="text-[#548BCB] font-semibold hover:underline"
              >
                Knowledge Base
              </button>{' '}
              by adding a custom FAQ and asking the chatbot about it.
            </li>
          </ol>
        </section>

        <section className="neu-surface rounded-3xl p-6 space-y-3">
          <h2 className="text-base font-bold text-[#29384A] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#548BCB]" aria-hidden="true" />
            <span>Running & Deploying Locally</span>
          </h2>
          <div className="space-y-2.5 text-xs text-[#5B6C82]">
            <p>
              <strong className="text-[#29384A]">1. Install dependencies:</strong>
            </p>
            <pre className="neu-inset-sm p-3 rounded-xl text-[#29384A] font-mono overflow-x-auto">
              npm install
            </pre>
            <p>
              <strong className="text-[#29384A]">2. Configure environment variable:</strong> Set{' '}
              <code className="font-mono">GEMINI_API_KEY</code> in your{' '}
              <code className="font-mono">.env</code> file (or AI Studio Secrets).
            </p>
            <p>
              <strong className="text-[#29384A]">3. Start development server (Express + Vite on port 3000):</strong>
            </p>
            <pre className="neu-inset-sm p-3 rounded-xl text-[#29384A] font-mono overflow-x-auto">
              npm run dev
            </pre>
            <p>
              <strong className="text-[#29384A]">4. Build & run production bundle:</strong>
            </p>
            <pre className="neu-inset-sm p-3 rounded-xl text-[#29384A] font-mono overflow-x-auto">
              npm run build && NODE_ENV=production npm start
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
