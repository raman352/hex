import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Headphones,
  Loader2,
  ShieldCheck,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { AuthUser } from '../types';

interface AuthLandingPageProps {
  sessionNotice?: string | null;
  onAuthSuccess: (user: AuthUser, sessionToken?: string) => void;
}

const SAMPLE_DEMO_NAMES = ['Priya Sharma', 'Aarav Mehta', 'Sneha Nair'];

export function AuthLandingPage({
  sessionNotice,
  onAuthSuccess,
}: AuthLandingPageProps) {
  const [demoName, setDemoName] = useState('Priya Sharma');
  const [activePortalLoading, setActivePortalLoading] = useState<'customer' | 'admin' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startDemoSession = async (portal: 'customer' | 'admin', requestedName?: string) => {
    setErrorMsg(null);
    const trimmedName = (requestedName ?? demoName).trim();

    if (portal === 'customer' && trimmedName.length < 2) {
      setErrorMsg('Please enter a demo name (at least 2 characters) before starting the customer chat.');
      return;
    }

    setActivePortalLoading(portal);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          portal,
          demoName: portal === 'customer' ? trimmedName : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to start demonstration session.');
      }
      onAuthSuccess(data.user as AuthUser, data.sessionToken);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to start demonstration session.');
    } finally {
      setActivePortalLoading(null);
    }
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void startDemoSession('customer');
  };

  return (
    <div className="min-h-screen bg-[#E9F0F7] text-[#29384A] flex flex-col justify-between">
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-5xl w-full space-y-8">
          {/* Top Brand & Demonstration Mode Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-3">
                <span className="neu-btn-primary w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                  <Headphones className="w-6 h-6" aria-hidden="true" />
                </span>
                <div>
                  <span className="font-display text-2xl font-bold tracking-tight text-[#29384A] block">
                    TechCare DeskPilot
                  </span>
                  <span className="text-xs font-semibold text-[#548BCB]">
                    Demonstration Mode · Hackathon Prototype
                  </span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#29384A] leading-tight text-balance">
                AI Customer Support &amp; Helpdesk Demo Access
              </h1>
              <p className="text-sm sm:text-base text-[#5B6C82] leading-relaxed">
                Choose a demonstration role below to explore the Gemini AI customer chatbot, ticket management workflow, and live knowledge base editor. No passwords or real credentials are required or collected.
              </p>
            </div>

            <div className="neu-inset-sm rounded-2xl p-4 text-xs text-[#5B6C82] max-w-xs shrink-0 space-y-1">
              <p className="font-bold text-[#29384A]">Demonstration Mode Notice</p>
              <p className="leading-relaxed">
                All orders, tickets, and policies shown are fictional demo data persisted locally in your browser.
              </p>
            </div>
          </div>

          {sessionNotice && !errorMsg && (
            <div className="neu-status-open p-4 rounded-2xl text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{sessionNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="neu-status-error p-4 rounded-2xl text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Two Clearly Labelled Demo Access Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch">
            {/* Option 1: Customer Demo */}
            <section
              aria-label="Customer Demo Access"
              className="neu-surface rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="neu-surface-bright w-11 h-11 rounded-2xl text-[#548BCB] flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#548BCB]">
                        Option 1 · Demonstration Mode
                      </span>
                      <h2 className="text-xl font-bold text-[#29384A]">
                        Customer Demo
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#5B6C82] leading-relaxed">
                  Opens the TechCare AI support chatbot in English and Hinglish, lets you check demo orders, and record support tickets.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="neu-inset-sm p-3 rounded-2xl flex items-center gap-2 text-[#29384A]">
                    <Bot className="w-4 h-4 text-[#548BCB] shrink-0" aria-hidden="true" />
                    <span>Gemini AI Chat</span>
                  </div>
                  <div className="neu-inset-sm p-3 rounded-2xl flex items-center gap-2 text-[#29384A]">
                    <Ticket className="w-4 h-4 text-[#548BCB] shrink-0" aria-hidden="true" />
                    <span>Ticket Tracker</span>
                  </div>
                </div>

                <form onSubmit={handleCustomerSubmit} className="space-y-4 pt-1" noValidate>
                  <div>
                    <label
                      htmlFor="demo-customer-name"
                      className="block text-xs font-semibold text-[#29384A] mb-1.5"
                    >
                      Enter Your Demo Name
                    </label>
                    <input
                      id="demo-customer-name"
                      type="text"
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      maxLength={60}
                      className="neu-inset-sm w-full px-4 py-3 text-sm text-[#29384A] placeholder:text-[#708096] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#548BCB]"
                    />
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#5B6C82]">
                      <span>Quick demo names:</span>
                      {SAMPLE_DEMO_NAMES.map((sample) => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => setDemoName(sample)}
                          className="neu-btn px-2.5 py-1 rounded-lg font-semibold text-[#548BCB]"
                        >
                          {sample}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={activePortalLoading !== null}
                    className="neu-btn-primary w-full py-3.5 px-5 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
                  >
                    {activePortalLoading === 'customer' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Opening Customer Chat...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Customer Demo</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </section>

            {/* Option 2: Admin Demo */}
            <section
              aria-label="Admin Demo Access"
              className="neu-surface rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="neu-surface-bright w-11 h-11 rounded-2xl text-[#548BCB] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#548BCB]">
                      Option 2 · Demonstration Mode
                    </span>
                    <h2 className="text-xl font-bold text-[#29384A]">
                      Admin Demo
                    </h2>
                  </div>
                </div>

                <p className="text-sm text-[#5B6C82] leading-relaxed">
                  Opens the Admin Dashboard with immediate access to Ticket Management (triage, status updates, resolution notes) and live Knowledge Base editing.
                </p>

                <div className="space-y-2.5 pt-1">
                  <div className="neu-inset-sm p-3.5 rounded-2xl flex items-start gap-3 text-xs">
                    <Ticket className="w-4 h-4 text-[#548BCB] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-bold text-[#29384A]">Ticket Management Desk</p>
                      <p className="text-[#5B6C82] mt-0.5">
                        Review customer complaints, update statuses (Open → In Progress → Resolved), and save notes.
                      </p>
                    </div>
                  </div>

                  <div className="neu-inset-sm p-3.5 rounded-2xl flex items-start gap-3 text-xs">
                    <BookOpen className="w-4 h-4 text-[#548BCB] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-bold text-[#29384A]">Live Knowledge Base Editor</p>
                      <p className="text-[#5B6C82] mt-0.5">
                        Add, edit, or remove demonstration FAQs — Gemini AI uses your updates immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={activePortalLoading !== null}
                onClick={() => void startDemoSession('admin')}
                className="neu-btn-primary w-full py-3.5 px-5 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#548BCB]"
              >
                {activePortalLoading === 'admin' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Opening Admin Dashboard...</span>
                  </>
                ) : (
                  <>
                    <span>Open Admin Demo</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-[#EEF3F9] shadow-[0_-6px_18px_rgba(163,181,204,0.22)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#5B6C82]">
          <span className="font-semibold text-[#29384A]">TechCare DeskPilot · Demonstration Mode</span>
          <span>Hackathon MVP · No real credentials or passwords collected</span>
        </div>
      </footer>
    </div>
  );
}
