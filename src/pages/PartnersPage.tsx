import React, { useState } from 'react';
import { Users, Search, Building2, MapPin, Mail, Phone, ExternalLink, ShieldCheck } from 'lucide-react';
import { tradeService } from '../services/tradeService';
import { LogisticsPartner } from '../types/trade';

export const PartnersPage: React.FC = () => {
  const [partners] = useState<LogisticsPartner[]>(tradeService.getPartners());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const types = [
    'All',
    'Freight Forwarder',
    'Transporter',
    'CFS',
    'Customs / Documentation',
    'Warehouse',
  ];

  const filtered = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.coverage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'All' || p.type === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-800" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Logistics Partners</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Network of bonded CFS yards, licensed Customs Brokers, ocean freight forwarders, and
            intermodal transporters.
          </p>
        </div>

        <div className="font-mono text-[11px] text-slate-400">
          Demo partner ecosystem · SLA monitored
        </div>
      </div>

      {/* Filter and search */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search partner name, trade lane coverage, or contact person..."
              className="w-full rounded border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-auto rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-hidden"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                Category: {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Partners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{p.name}</h2>
                  <span className="text-[11px] font-medium text-blue-700">{p.type}</span>
                </div>
                <span className="rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                  {p.status}
                </span>
              </div>

              <div className="mt-2.5 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Coverage: {p.coverage}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{p.contactPerson} ({p.contactEmail})</span>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-slate-500 leading-normal border-t border-slate-100 pt-2.5">
                {p.notes}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="font-mono text-[11px] text-slate-400">
                Active Orders: <span className="font-semibold text-slate-800">{p.activeShipmentCount}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                Performance: <span className="font-semibold text-slate-800">{p.rating}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
