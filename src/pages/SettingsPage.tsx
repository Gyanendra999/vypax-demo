import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings, Building2, Globe, Shield, Terminal, Save, Check } from 'lucide-react';
import { DEMO_COMPANY } from '../data/mockData';

export const SettingsPage: React.FC = () => {
  const { showToast } = useOutletContext<{ showToast: (msg: string) => void }>();

  const [company, setCompany] = useState({
    name: DEMO_COMPANY.name,
    iecNumber: DEMO_COMPANY.iecNumber,
    gstin: DEMO_COMPANY.gstin,
    adCode: DEMO_COMPANY.adCode,
    portRegistration: DEMO_COMPANY.portRegistration,
    defaultCurrency: 'USD',
    defaultIncoterm: 'CIF - Cost, Insurance and Freight',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Company profile settings updated');
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
          Org ID: {DEMO_COMPANY.code}
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

        {/* Future Integrations Architecture (Section 36) */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Terminal className="h-4 w-4 text-slate-700" />
            <h2 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
              Carrier & Customs Integration Connectors
            </h2>
          </div>

          <p className="text-[11px] text-slate-500">
            Vypax is architected for direct integration with port community systems, carrier EDI
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
