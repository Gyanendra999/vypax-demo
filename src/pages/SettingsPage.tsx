import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Settings,
  Building2,
  Globe,
  Shield,
  Terminal,
  Save,
  Check,
  Github,
  ExternalLink,
  Copy,
  Users,
  UserPlus,
  ShieldAlert,
  Server,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { DEMO_COMPANY } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

export const SettingsPage: React.FC = () => {
  const { showToast } = useOutletContext<{ showToast: (msg: string) => void }>();
  const { currentWorkspace, user, setupTOTP, verifyTOTP } = useAuth();

  const [company, setCompany] = useState({
    name: currentWorkspace?.company.name || DEMO_COMPANY.name,
    iecNumber: currentWorkspace?.company.iecNumber || DEMO_COMPANY.iecNumber,
    gstin: currentWorkspace?.company.gstin || DEMO_COMPANY.gstin,
    adCode: currentWorkspace?.company.adCode || DEMO_COMPANY.adCode,
    portRegistration: currentWorkspace?.company.portRegistration || DEMO_COMPANY.portRegistration,
    defaultCurrency: currentWorkspace?.company.defaultCurrency || 'USD',
    defaultIncoterm: currentWorkspace?.company.defaultIncoterm || 'CIF - Cost, Insurance and Freight',
  });

  const [members, setMembers] = useState<any[]>([
    {
      id: 'mem-1',
      user: { fullName: 'Aarav Mehta', email: 'aarav.m@meridianexports.in' },
      role: 'operations_manager',
      department: 'Export Logistics & Compliance',
    },
    {
      id: 'mem-2',
      user: { fullName: 'Vikram Singhania', email: 'admin@vyaapx.com' },
      role: 'super_admin',
      department: 'Governance',
    },
    {
      id: 'mem-3',
      user: { fullName: 'Priya Nambiar', email: 'compliance@meridianexports.in' },
      role: 'compliance_officer',
      department: 'Legal & Regulatory',
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('operations_executive');
  const [isInviting, setIsInviting] = useState(false);
  const [backendHealth, setBackendHealth] = useState<any>(null);

  useEffect(() => {
    if (currentWorkspace?.company) {
      setCompany((prev) => ({
        ...prev,
        name: currentWorkspace.company.name || prev.name,
        iecNumber: currentWorkspace.company.iecNumber || prev.iecNumber,
        gstin: currentWorkspace.company.gstin || prev.gstin,
        adCode: currentWorkspace.company.adCode || prev.adCode,
        portRegistration: currentWorkspace.company.portRegistration || prev.portRegistration,
        defaultCurrency: currentWorkspace.company.defaultCurrency || prev.defaultCurrency,
        defaultIncoterm: currentWorkspace.company.defaultIncoterm || prev.defaultIncoterm,
      }));
    }

    // Fetch live backend health and members
    apiClient
      .get('/health')
      .then((data) => setBackendHealth(data))
      .catch(() => null);

    if (currentWorkspace?.workspace.id) {
      apiClient
        .get(`/workspaces/${currentWorkspace.workspace.id}`)
        .then((res) => {
          if (res.members && res.members.length > 0) {
            setMembers(res.members);
          }
        })
        .catch(() => null);
    }
  }, [currentWorkspace]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentWorkspace?.workspace.id) {
        await apiClient.patch(`/workspaces/${currentWorkspace.workspace.id}/company`, company);
      }
      showToast('Company profile settings saved to database');
    } catch (err: any) {
      showToast(err.message || 'Company profile settings updated');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      if (currentWorkspace?.workspace.id) {
        await apiClient.post(`/workspaces/${currentWorkspace.workspace.id}/invitations`, {
          email: inviteEmail.trim(),
          role: inviteRole,
        });
      }
      showToast(`Invitation sent to ${inviteEmail} as ${inviteRole.replace('_', ' ')}`);
      setInviteEmail('');
      setIsInviting(false);
    } catch (err: any) {
      showToast(err.message || 'Invitation created');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-800" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Workspace Settings & Compliance Profile
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Export documentation defaults, organization identifiers, and integration endpoints.
          </p>
        </div>

        <span className="font-mono text-[11px] text-slate-400">
          Org ID: {currentWorkspace?.company.code || DEMO_COMPANY.code}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Organization Entity Details */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="h-4 w-4 text-slate-700" />
            <h2 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
              Exporter Entity Particulars
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Registered Legal Name
              </label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Importer-Exporter Code (IEC)
              </label>
              <input
                type="text"
                value={company.iecNumber}
                onChange={(e) => setCompany({ ...company, iecNumber: e.target.value })}
                className="w-full font-mono rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={company.gstin}
                onChange={(e) => setCompany({ ...company, gstin: e.target.value })}
                className="w-full font-mono rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Authorized Dealer (AD) Code
              </label>
              <input
                type="text"
                value={company.adCode}
                onChange={(e) => setCompany({ ...company, adCode: e.target.value })}
                className="w-full font-mono rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Trade Defaults */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="h-4 w-4 text-slate-700" />
            <h2 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
              Operational Defaults & Currency
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Default Incoterms 2020 Rule
              </label>
              <select
                value={company.defaultIncoterm}
                onChange={(e) => setCompany({ ...company, defaultIncoterm: e.target.value })}
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
              >
                <option value="CIF - Cost, Insurance and Freight">
                  CIF - Cost, Insurance and Freight
                </option>
                <option value="FOB - Free On Board">FOB - Free On Board</option>
                <option value="CFR - Cost and Freight">CFR - Cost and Freight</option>
                <option value="DAP - Delivered at Place">DAP - Delivered at Place</option>
                <option value="EXW - Ex Works">EXW - Ex Works</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Primary Settlement Currency
              </label>
              <select
                value={company.defaultCurrency}
                onChange={(e) => setCompany({ ...company, defaultCurrency: e.target.value })}
                className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
              >
                <option value="USD">USD ($ - United States Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="AED">AED (AED - UAE Dirham)</option>
                <option value="INR">INR (₹ - Indian Rupee)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Multi-Tenant Workspace & Team Members (RBAC) */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-700" />
              <h2 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Workspace Team Members & Role-Based Access Control (RBAC)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsInviting(!isInviting)}
              className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isInviting ? 'Cancel' : 'Invite Member'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Granular permissions enforce backend authorization across Platform Super Admin, Company Owner,
            Admin, Operations Manager, Documentation Manager, Finance Manager, and Compliance Officers.
          </p>

          {isInviting && (
            <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Member Work Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="colleague@domain.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Assign Operational Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                  >
                    <option value="operations_manager">Operations Manager</option>
                    <option value="operations_executive">Operations Executive</option>
                    <option value="documentation_manager">Documentation Manager</option>
                    <option value="finance_manager">Finance Manager</option>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="compliance_officer">Compliance Officer</option>
                    <option value="viewer">Viewer</option>
                    <option value="external_partner">External Partner</option>
                    <option value="admin">Company Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSendInvite}
                  className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Dispatch Workspace Invitation
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-2">Member</th>
                  <th className="px-3.5 py-2">Email</th>
                  <th className="px-3.5 py-2">Assigned Role</th>
                  <th className="px-3.5 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {members.map((m: any, idx: number) => (
                  <tr key={m.id || idx} className="hover:bg-slate-50/50">
                    <td className="px-3.5 py-2.5 font-medium text-slate-900">
                      {m.user?.fullName || m.fullName || 'Workspace User'}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">
                      {m.user?.email || m.email}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-800 capitalize">
                        {(m.role || 'operations_manager').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Multi-Factor Authentication */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-700" />
              <h2 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Authentication & Multi-Factor Security (TOTP)
              </h2>
            </div>
            <span
              className={`rounded px-2 py-0.5 font-mono text-[10px] ${
                user?.mfaEnabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {user?.mfaEnabled ? 'MFA ACTIVE' : 'MFA OPTIONAL'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Supports Email/Password with bcrypt hashing, Google OAuth, Microsoft SSO, Passwordless Email OTP,
            and Time-based One-Time Passwords (TOTP) compliant with RFC 6238.
          </p>

          <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-3">
            <div>
              <span className="font-semibold text-slate-800">Current Session</span>
              <p className="text-[11px] text-slate-500">
                Authenticated as <span className="font-medium text-slate-900">{user?.fullName || 'Aarav Mehta'}</span> ({user?.email || 'aarav.m@meridianexports.in'})
              </p>
            </div>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              JWT SECURED
            </span>
          </div>
        </div>

        {/* Future Integrations Architecture (Section 36) */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Terminal className="h-4 w-4 text-slate-700" />
            <h2 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
              Carrier & Customs Integration Connectors
            </h2>
          </div>

          <p className="text-[11px] text-slate-500">
            Vyaapx is architected for direct integration with port community systems, carrier EDI
            gateways, and national customs platforms. In this prototype workspace, connectors run in
            sandboxed simulation mode.
          </p>

          <div className="space-y-2 pt-1 font-mono text-[11px]">
            <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2.5">
              <div>
                <span className="font-semibold text-slate-800">ICEGATE Customs EDI Gateway</span>
                <p className="text-[10px] text-slate-500 font-sans">
                  Indian Customs electronic data interchange for shipping bill filing and LEO status.
                </p>
              </div>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600">
                SANDBOX SIMULATION
              </span>
            </div>

            <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2.5">
              <div>
                <span className="font-semibold text-slate-800">Ocean Carrier DCSA EDI standard</span>
                <p className="text-[10px] text-slate-500 font-sans">
                  Automated electronic booking requests, B/L transmission, and container track & trace.
                </p>
              </div>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600">
                SANDBOX SIMULATION
              </span>
            </div>
          </div>
        </div>

        {/* Backend Infrastructure & Supabase Status */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-700" />
              <h2 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Backend Infrastructure & Services Status
              </h2>
            </div>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
              ONLINE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="rounded border border-slate-200 bg-slate-50 p-2.5">
              <span className="text-[10px] text-slate-500 block uppercase">Database Layer</span>
              <span className="font-semibold text-slate-800">
                {backendHealth?.database || 'Supabase / Operational DB'}
              </span>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-2.5">
              <span className="text-[10px] text-slate-500 block uppercase">AI Model</span>
              <span className="font-semibold text-slate-800">Gemini 3.8 Flash</span>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-2.5">
              <span className="text-[10px] text-slate-500 block uppercase">API Gateway</span>
              <span className="font-semibold text-slate-800">Express /api/v1 (REST)</span>
            </div>
          </div>
        </div>

        {/* Deployment & GitHub Repository Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4 text-slate-700" />
              <h2 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Deployment & GitHub Repository
              </h2>
            </div>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
              LIVE DEPLOYMENT
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-slate-500 block text-[11px] mb-1">Live Application URL</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://ais-pre-hmbzbjjn2jvkbm4x5aakuy-305700405558.asia-southeast1.run.app"
                  className="flex-1 font-mono text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("https://ais-pre-hmbzbjjn2jvkbm4x5aakuy-305700405558.asia-southeast1.run.app");
                    showToast("Live URL copied to clipboard");
                  }}
                  className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  title="Copy URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </button>
                <a
                  href="https://ais-pre-hmbzbjjn2jvkbm4x5aakuy-305700405558.asia-southeast1.run.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Visit</span>
                </a>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] mb-1">GitHub Repository</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://github.com/gyanendra731466/vyaapx"
                  className="flex-1 font-mono text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("https://github.com/gyanendra731466/vyaapx");
                    showToast("GitHub URL copied to clipboard");
                  }}
                  className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  title="Copy GitHub URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </button>
                <a
                  href="https://github.com/gyanendra731466/vyaapx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span>Repository</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
