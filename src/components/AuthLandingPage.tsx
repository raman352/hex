import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  KeyRound,
  Loader2,
  ShieldCheck,
  Ticket,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { AuthUser } from '../types';

interface AuthLandingPageProps {
  sessionNotice?: string | null;
  onAuthSuccess: (user: AuthUser, sessionToken?: string) => void;
}

type PortalTab = 'customer' | 'admin';
type CustomerMode = 'login' | 'register' | 'forgot';

export function AuthLandingPage({
  sessionNotice,
  onAuthSuccess,
}: AuthLandingPageProps) {
  const [portal, setPortal] = useState<PortalTab>('customer');
  const [customerMode, setCustomerMode] = useState<CustomerMode>('login');

  const [custLoginEmail, setCustLoginEmail] = useState('');
  const [custLoginPassword, setCustLoginPassword] = useState('');
  const [showCustLoginPw, setShowCustLoginPw] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPw, setShowAdminPw] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const clearFeedback = () => {
    setErrorMsg(null);
    setForgotSuccess(null);
  };

  const switchPortal = (next: PortalTab) => {
    setPortal(next);
    clearFeedback();
  };

  const switchCustomerMode = (mode: CustomerMode) => {
    setCustomerMode(mode);
    clearFeedback();
  };

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const email = custLoginEmail.trim();
    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid customer email address.');
      return;
    }
    if (!custLoginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password: custLoginPassword,
          portal: 'customer',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to sign in.');
      }
      onAuthSuccess(data.user as AuthUser, data.sessionToken);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const name = regName.trim();
    const email = regEmail.trim();

    if (name.length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter to confirm.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: name,
          email,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to create customer account.');
      }
      onAuthSuccess(data.user as AuthUser, data.sessionToken);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create customer account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const email = forgotEmail.trim();
    if (!isValidEmail(email)) {
      setErrorMsg('Please enter the email address associated with your account.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to process password reset request.');
      }
      setForgotSuccess(data.message);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to process request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const identifier = adminEmail.trim();
    if (!identifier) {
      setErrorMsg('Please enter your administrator email or ID.');
      return;
    }
    if (!adminPassword) {
      setErrorMsg('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: identifier,
          password: adminPassword,
          portal: 'admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Administrator sign-in failed.');
      }
      onAuthSuccess(data.user as AuthUser, data.sessionToken);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Administrator sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FC] text-[#20283B] grid grid-cols-1 lg:grid-cols-2">
      {/* Left Split Panel: Pastel Blue & Lavender Gradient Brand Experience */}
      <aside className="relative overflow-hidden bg-gradient-to-br from-[#EDF2FE] via-[#EAE6FD] to-[#DDE7FE] p-8 sm:p-12 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E2E8F6]">
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#C9B9FF]/35 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-[#5486EA]/20 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 space-y-10 max-w-lg">
          <div className="inline-flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5486EA] to-[#8B72E8] text-white flex items-center justify-center shadow-[0_10px_24px_rgba(84,134,234,0.3)] shrink-0">
              <Headphones className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-[#20283B] block">
                TechCare <span className="text-[#5486EA]">DeskPilot</span>
              </span>
              <span className="text-xs font-medium text-[#78849B]">
                Intelligent Customer Support Platform
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[#20283B] leading-tight text-balance">
              Fast, thoughtful customer care powered by live knowledge.
            </h1>
            <p className="text-[15px] text-[#536079] leading-relaxed">
              Customers get instant assistance in English or Hinglish with seamless ticket escalation, while support teams triage requests and update policies in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="saas-glass rounded-2xl p-4 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#EEF3FE] text-[#5486EA] flex items-center justify-center">
                <Bot className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-[#20283B]">AI Support Assistant</h2>
              <p className="text-xs text-[#78849B] leading-relaxed">
                Grounded answers on orders, warranties, returns, and voice input support.
              </p>
            </div>

            <div className="saas-glass rounded-2xl p-4 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#F2EEFD] text-[#8B72E8] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-[#20283B]">Helpdesk Analytics</h2>
              <p className="text-xs text-[#78849B] leading-relaxed">
                Live status breakdowns, category insights, and instant FAQ publishing.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-10 flex flex-wrap items-center gap-4 text-xs text-[#5E6B85]">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#5486EA]" aria-hidden="true" />
            <span>Role-Separated Access</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-[#8B72E8]" aria-hidden="true" />
            <span>Scoped Ticket Tracking</span>
          </span>
        </div>
      </aside>

      {/* Right Split Panel: Clean White Login & Registration Card */}
      <main className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6EBF5] shadow-[0_20px_50px_rgba(32,40,59,0.06)] p-6 sm:p-8 space-y-6">
          {/* Role Switcher */}
          <div
            className="bg-[#F4F6FC] p-1 rounded-2xl grid grid-cols-2 gap-1 border border-[#E6EBF5]"
            role="tablist"
            aria-label="Account Access Type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={portal === 'customer'}
              onClick={() => switchPortal('customer')}
              className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA] ${
                portal === 'customer'
                  ? 'bg-white text-[#5486EA] shadow-xs'
                  : 'text-[#78849B] hover:text-[#20283B]'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={portal === 'admin'}
              onClick={() => switchPortal('admin')}
              className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA] ${
                portal === 'admin'
                  ? 'bg-white text-[#8B72E8] shadow-xs'
                  : 'text-[#78849B] hover:text-[#20283B]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Administrator</span>
            </button>
          </div>

          {sessionNotice && !errorMsg && (
            <div className="bg-[#EEF3FE] border border-[#DCE6FB] text-[#3B6FD4] p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{sessionNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="bg-[#FDEEEF] border border-[#FAD5D8] text-[#C8434D] p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {forgotSuccess && (
            <div
              role="status"
              className="bg-[#EAF9F3] border border-[#CBEFE0] text-[#17875E] p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{forgotSuccess}</span>
            </div>
          )}

          {/* CUSTOMER PORTAL */}
          {portal === 'customer' && (
            <div className="space-y-5">
              {customerMode !== 'forgot' && (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-[#20283B]">
                      {customerMode === 'login' ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p className="text-xs text-[#78849B] mt-0.5">
                      {customerMode === 'login'
                        ? 'Sign in to access Customer Chat and your tickets.'
                        : 'Register a customer account to get support.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      switchCustomerMode(customerMode === 'login' ? 'register' : 'login')
                    }
                    className="text-xs font-semibold text-[#5486EA] hover:underline inline-flex items-center gap-1 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA] rounded"
                  >
                    {customerMode === 'login' ? (
                      <>
                        <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Register</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </div>
              )}

              {customerMode === 'login' && (
                <form onSubmit={handleCustomerLogin} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="cust-login-email"
                      className="block text-xs font-semibold text-[#20283B] mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="cust-login-email"
                      type="email"
                      autoComplete="email"
                      value={custLoginEmail}
                      onChange={(e) => setCustLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="saas-input w-full px-4 py-2.5 text-sm rounded-xl"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="cust-login-password"
                        className="block text-xs font-semibold text-[#20283B]"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchCustomerMode('forgot')}
                        className="text-xs font-semibold text-[#5486EA] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA] rounded"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="cust-login-password"
                        type={showCustLoginPw ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={custLoginPassword}
                        onChange={(e) => setCustLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="saas-input w-full pl-4 pr-11 py-2.5 text-sm rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustLoginPw((p) => !p)}
                        aria-label={showCustLoginPw ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#78849B] hover:text-[#20283B]"
                      >
                        {showCustLoginPw ? (
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="saas-btn-primary w-full py-3 px-5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 min-h-[46px] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <div className="bg-[#F4F6FC] border border-[#E6EBF5] rounded-2xl p-3 flex items-center justify-between gap-2 text-xs">
                    <div className="text-[#78849B] min-w-0">
                      <span className="font-semibold text-[#20283B] block">Demo Customer</span>
                      <span className="font-mono text-[11px] truncate block">
                        priya.demo@techcare.example
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustLoginEmail('priya.demo@techcare.example');
                        setCustLoginPassword('Customer@1234');
                        clearFeedback();
                      }}
                      className="saas-btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold text-[#5486EA] shrink-0"
                    >
                      Fill Demo
                    </button>
                  </div>
                </form>
              )}

              {customerMode === 'register' && (
                <form onSubmit={handleCustomerRegister} className="space-y-3.5" noValidate>
                  <div>
                    <label
                      htmlFor="cust-reg-name"
                      className="block text-xs font-semibold text-[#20283B] mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="cust-reg-name"
                      type="text"
                      autoComplete="name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Aarav Mehta"
                      className="saas-input w-full px-4 py-2.5 text-sm rounded-xl"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cust-reg-email"
                      className="block text-xs font-semibold text-[#20283B] mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="cust-reg-email"
                      type="email"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="saas-input w-full px-4 py-2.5 text-sm rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="cust-reg-password"
                        className="block text-xs font-semibold text-[#20283B] mb-1.5"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="cust-reg-password"
                          type={showRegPw ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 6 chars"
                          className="saas-input w-full pl-3.5 pr-9 py-2.5 text-sm rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPw((p) => !p)}
                          aria-label={showRegPw ? 'Hide password' : 'Show password'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-[#78849B] hover:text-[#20283B]"
                        >
                          {showRegPw ? (
                            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="cust-reg-confirm"
                        className="block text-xs font-semibold text-[#20283B] mb-1.5"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="cust-reg-confirm"
                        type={showRegPw ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="saas-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="saas-btn-primary w-full py-3 px-5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 min-h-[46px] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5486EA]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" aria-hidden="true" />
                        <span>Create Customer Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {customerMode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl font-bold text-[#20283B]">Password recovery</h2>
                    <button
                      type="button"
                      onClick={() => switchCustomerMode('login')}
                      className="text-xs font-semibold text-[#5486EA] hover:underline"
                    >
                      Back to Sign In
                    </button>
                  </div>

                  <p className="text-xs text-[#78849B] leading-relaxed">
                    Enter your customer email address to request password recovery instructions.
                  </p>

                  <div>
                    <label
                      htmlFor="cust-forgot-email"
                      className="block text-xs font-semibold text-[#20283B] mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="cust-forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="saas-input w-full px-4 py-2.5 text-sm rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="saas-btn-primary w-full py-3 px-5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 min-h-[46px] disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" aria-hidden="true" />
                        <span>Send Recovery Request</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ADMINISTRATOR PORTAL */}
          {portal === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4" noValidate>
              <div>
                <h2 className="text-xl font-bold text-[#20283B]">Administrator Sign In</h2>
                <p className="text-xs text-[#78849B] mt-0.5">
                  Authorised team access to analytics, ticket triage, and knowledge base.
                </p>
              </div>

              <div>
                <label
                  htmlFor="admin-login-email"
                  className="block text-xs font-semibold text-[#20283B] mb-1.5"
                >
                  Administrator Email / ID
                </label>
                <input
                  id="admin-login-email"
                  type="text"
                  autoComplete="username"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin.demo@techcare.example"
                  className="saas-input w-full px-4 py-2.5 text-sm rounded-xl"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-login-password"
                  className="block text-xs font-semibold text-[#20283B] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-login-password"
                    type={showAdminPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter administrator password"
                    className="saas-input w-full pl-4 pr-11 py-2.5 text-sm rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPw((p) => !p)}
                    aria-label={showAdminPw ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[#78849B] hover:text-[#20283B]"
                  >
                    {showAdminPw ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="saas-btn-primary w-full py-3 px-5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 min-h-[46px] disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    <span>Sign In to Admin Overview</span>
                  </>
                )}
              </button>

              <div className="bg-[#F4F6FC] border border-[#E6EBF5] rounded-2xl p-3 flex items-center justify-between gap-2 text-xs">
                <div className="text-[#78849B] min-w-0">
                  <span className="font-semibold text-[#20283B] block">Demo Admin</span>
                  <span className="font-mono text-[11px] truncate block">
                    admin.demo@techcare.example
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('admin.demo@techcare.example');
                    setAdminPassword('Admin@1234');
                    clearFeedback();
                  }}
                  className="saas-btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold text-[#8B72E8] shrink-0"
                >
                  Fill Demo
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
