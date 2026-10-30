import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useAuth, WorkspaceItem } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'workspace' | 'mfa';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'workspace' }) => {
  const {
    user,
    workspaces,
    currentWorkspace,
    currentRole,
    isAuthenticated,
    login,
    register,
    logout,
    switchWorkspace,
    loginOAuth,
    sendEmailOTP,
    verifyEmailOTP,
    sendPhoneOTP,
    verifyPhoneOTP,
    setupTOTP,
    verifyTOTP,
    refreshAuth,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'workspace' | 'login' | 'register' | 'otp' | 'mfa'>(
    isAuthenticated ? 'workspace' : 'login'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMode, setOtpMode] = useState<'email' | 'phone'>('email');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWs, setIsCreatingWs] = useState(false);
  const [mfaSecretData, setMfaSecretData] = useState<{ secret: string; otpauthUrl: string; backupCodes: string[] } | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  // Status messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.requiresMFA) {
        setActiveTab('mfa');
      } else {
        setSuccess('Logged in successfully');
        setTimeout(() => onClose(), 600);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, fullName, companyName });
      setSuccess('Account and organization registered successfully!');
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOTP = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (otpMode === 'email') {
        const debugOtp = await sendEmailOTP(email);
        setOtpSent(true);
        setSuccess(`Verification code dispatched to ${email}. (Demo code: ${debugOtp})`);
      } else {
        const debugOtp = await sendPhoneOTP(phone);
        setOtpSent(true);
        setSuccess(`SMS OTP dispatched to ${phone}. (Demo code: ${debugOtp})`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (otpMode === 'email') {
        await verifyEmailOTP(email, otpCode);
      } else {
        await verifyPhoneOTP(phone, otpCode);
      }
      setSuccess('Identity verified successfully!');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiClient.post('/workspaces', { name: newWorkspaceName.trim() });
      await refreshAuth();
      if (res && res.id) {
        await switchWorkspace(res.id);
      }
      setIsCreatingWs(false);
      setNewWorkspaceName('');
      setSuccess(`Workspace "${res.name}" provisioned.`);
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetupMFA = async () => {
    setError(null);
    try {
      const data = await setupTOTP();
      setMfaSecretData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate MFA setup.');
    }
  };

  const handleConfirmMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyTOTP(mfaCode);
      setSuccess('Two-factor authentication (TOTP) successfully activated.');
      setMfaSecretData(null);
    } catch (err: any) {
      setError(err.message || 'MFA token validation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {activeTab === 'workspace'
                  ? 'Organization & Workspace Management'
                  : activeTab === 'login'
                  ? 'Sign in to Vyaapx'
                  : activeTab === 'register'
                  ? 'Register Exporter Organization'
                  : activeTab === 'otp'
                  ? 'Passwordless Authentication'
                  : 'Multi-Factor Security'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Tenant isolation and role-based access control
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="mt-3 flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium">
          {isAuthenticated && (
            <button
              onClick={() => {
                setActiveTab('workspace');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 rounded py-1.5 transition-colors ${
                activeTab === 'workspace' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Workspaces
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('login');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 rounded py-1.5 transition-colors ${
              activeTab === 'login' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>

          <button
            onClick={() => {
              setActiveTab('register');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 rounded py-1.5 transition-colors ${
              activeTab === 'register' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register Org
          </button>

          <button
            onClick={() => {
              setActiveTab('otp');
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 rounded py-1.5 transition-colors ${
              activeTab === 'otp' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OTP / Phone
          </button>

          {isAuthenticated && (
            <button
              onClick={() => {
                setActiveTab('mfa');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 rounded py-1.5 transition-colors ${
                activeTab === 'mfa' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MFA
            </button>
          )}
        </div>

        {/* Notifications */}
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="mt-4 text-xs">
          {/* TAB 1: WORKSPACES */}
          {activeTab === 'workspace' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Available Workspaces ({workspaces.length})
                </span>
                <button
                  onClick={() => setIsCreatingWs(!isCreatingWs)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-3 w-3" />
                  <span>{isCreatingWs ? 'Cancel' : 'New Workspace'}</span>
                </button>
              </div>

              {isCreatingWs && (
                <form onSubmit={handleCreateWorkspace} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. European Hub (Rotterdam)"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded bg-slate-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-slate-800"
                    >
                      Create
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {workspaces.map((item) => {
                  const isCurrent = currentWorkspace?.workspace.id === item.workspace.id;
                  return (
                    <div
                      key={item.workspace.id}
                      onClick={() => {
                        switchWorkspace(item.workspace.id);
                        setSuccess(`Switched to ${item.workspace.name}`);
                        setTimeout(() => onClose(), 500);
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className={`h-4 w-4 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="font-semibold text-slate-900 truncate">{item.workspace.name}</span>
                          {isCurrent && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                          {item.company.name} · Role: <span className="font-mono capitalize text-slate-700">{item.role.replace('_', ' ')}</span>
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>

              {/* User Identity info & Logout */}
              {user && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <div className="font-semibold text-slate-800">{user.fullName}</div>
                    <div className="text-[11px] text-slate-400">{user.email}</div>
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      onClose();
                    }}
                    className="flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SIGN IN (EMAIL + OAUTH) */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleEmailPasswordLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="aarav.m@meridianexports.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Password (demo: demo1234)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded border border-slate-300 pl-8 pr-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting ? 'Authenticating...' : 'Sign In with Password'}
                </button>
              </form>

              {/* Single Sign-On / OAuth */}
              <div className="relative py-1 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-2 text-[10px] uppercase text-slate-400">
                  Or continue with Enterprise OAuth
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => loginOAuth('google', 'trader@vyaapx-client.internal', 'Google Verified Trader')}
                  className="flex items-center justify-center gap-1.5 rounded border border-slate-200 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>Google OAuth</span>
                </button>
                <button
                  type="button"
                  onClick={() => loginOAuth('microsoft', 'msft_trader@vyaapx-client.internal', 'Microsoft Enterprise')}
                  className="flex items-center justify-center gap-1.5 rounded border border-slate-200 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>Microsoft SSO</span>
                </button>
              </div>

              <div className="rounded bg-slate-50 p-2.5 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Quick Demo Accounts:</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('aarav.m@meridianexports.in');
                      setPassword('demo1234');
                    }}
                    className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
                  >
                    Aarav (Operations Mgr)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@vyaapx.com');
                      setPassword('demo1234');
                    }}
                    className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
                  >
                    Vikram (Super Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('compliance@meridianexports.in');
                      setPassword('demo1234');
                    }}
                    className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
                  >
                    Priya (Compliance)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REGISTER NEW COMPANY */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Company / Exporter Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Trade Ltd."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john@apexglobal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Choose Master Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? 'Creating workspace...' : 'Register Company & Provision Workspace'}
              </button>
            </form>
          )}

          {/* TAB 4: PASSWORDLESS OTP / SMS */}
          {activeTab === 'otp' && (
            <div className="space-y-3">
              <div className="flex gap-2 border-b border-slate-100 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpMode('email');
                    setOtpSent(false);
                  }}
                  className={`text-[11px] font-medium ${otpMode === 'email' ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}
                >
                  Email OTP
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpMode('phone');
                    setOtpSent(false);
                  }}
                  className={`text-[11px] font-medium ${otpMode === 'phone' ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}
                >
                  Phone / SMS OTP
                </button>
              </div>

              {!otpSent ? (
                <div className="space-y-3">
                  {otpMode === 'email' ? (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Enter Email for One-Time Code
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="aarav.m@meridianexports.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98200 12345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={submitting || (otpMode === 'email' ? !email : !phone)}
                    className="w-full rounded-md bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Request One-Time Code'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full font-mono text-center tracking-widest text-base rounded border border-slate-300 py-2 text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || otpCode.length < 6}
                    className="w-full rounded-md bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {submitting ? 'Verifying...' : 'Verify Code & Sign In'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 5: MULTI-FACTOR AUTHENTICATION */}
          {activeTab === 'mfa' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">MFA Status</span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                      user?.mfaEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {user?.mfaEnabled ? 'ACTIVATED' : 'NOT ENABLED'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Protect export transactions with TOTP authenticator app tokens (Google Authenticator, Authy).
                </p>
              </div>

              {!mfaSecretData ? (
                <button
                  type="button"
                  onClick={handleSetupMFA}
                  className="w-full rounded bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  {user?.mfaEnabled ? 'Regenerate TOTP Key' : 'Configure Authenticator App'}
                </button>
              ) : (
                <form onSubmit={handleConfirmMFA} className="space-y-3 border-t border-slate-100 pt-2">
                  <div className="p-2.5 bg-slate-100 rounded text-center">
                    <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                      SECRET KEY (ENTER IN AUTHENTICATOR APP)
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 select-all tracking-wider">
                      {mfaSecretData.secret}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Enter 6-digit Code from Authenticator
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      className="w-full font-mono text-center tracking-widest text-base rounded border border-slate-300 py-1.5 text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Confirm & Enable TOTP
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
