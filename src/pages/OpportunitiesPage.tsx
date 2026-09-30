import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle,
  FileCheck,
  Calculator,
  ExternalLink,
} from 'lucide-react';
import { INITIAL_OPPORTUNITIES } from '../data/mockData';
import { TradeOpportunity } from '../types/trade';

export const OpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [minMargin, setMinMargin] = useState(10);

  const categories = [
    'All',
    'Engineering & Machinery',
    'Industrial Machinery',
    'Automotive & Mobility',
    'Agri & Food Processing',
    'Hardware & Construction',
  ];

  const destinations = ['All', 'United Arab Emirates', 'Germany', 'United States', 'Netherlands', 'Singapore'];

  const filtered = INITIAL_OPPORTUNITIES.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.hsCode.includes(searchQuery);

    const matchesCategory =
      selectedCategory === 'All' || opp.category === selectedCategory;

    const matchesDest =
      selectedDestination === 'All' || opp.destination.includes(selectedDestination);

    const matchesMargin = opp.indicativeMarginMin >= minMargin;

    return matchesSearch && matchesCategory && matchesDest && matchesMargin;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-slate-800" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Trade Opportunities
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Identify viable export trade corridors, market demand, and regulatory compliance requisites.
          </p>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span>Demo opportunity data · Indicative model</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product, tariff HS code, or trade corridor..."
              className="w-full rounded border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>

            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="w-full sm:w-auto rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-hidden"
            >
              {destinations.map((d) => (
                <option key={d} value={d}>
                  Market: {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Minimum Margin filter */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">Min Indicative Margin:</span>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={minMargin}
              onChange={(e) => setMinMargin(Number(e.target.value))}
              className="w-32 accent-slate-900"
            />
            <span className="font-mono font-semibold text-slate-800">{minMargin}%+</span>
          </div>

          <span className="text-[11px] text-slate-400">
            Showing {filtered.length} of {INITIAL_OPPORTUNITIES.length} opportunities
          </span>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <Compass className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-slate-800">No opportunities match filters</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting the minimum margin threshold or search terms.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedDestination('All');
                setMinMargin(10);
              }}
              className="mt-3 rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered.map((opp) => (
            <div
              key={opp.id}
              className="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{opp.title}</h2>
                    <span className="font-mono text-[11px] text-slate-400">HS {opp.hsCode}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>{opp.category}</span>
                    <span>·</span>
                    <span>Origin: {opp.origin}</span>
                    <span>·</span>
                    <span>Destination: {opp.destination}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 sm:text-right">
                  <div className="rounded bg-slate-50 px-2.5 py-1 border border-slate-200">
                    <span className="block text-[10px] text-slate-400">Demand Index</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {opp.demandLevel} Demand
                    </span>
                  </div>

                  <div className="rounded bg-emerald-50/70 px-2.5 py-1 border border-emerald-200">
                    <span className="block text-[10px] text-emerald-700">Indicative Margin</span>
                    <span className="font-mono font-bold text-emerald-800 text-xs">
                      {opp.indicativeMarginMin}% – {opp.indicativeMarginMax}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Overview body */}
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                <div className="lg:col-span-2">
                  <p className="text-slate-600 leading-relaxed">{opp.overview}</p>

                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Key Compliance & Document Requisites:
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      {opp.keyRequirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tariff & Freight Box */}
                <div className="rounded border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-between">
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Typical Tariff Structure</span>
                      <span className="font-medium text-slate-800">{opp.typicalTariffRate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Avg. TEU Ocean Freight</span>
                      <span className="font-mono font-medium text-slate-800">
                        ${opp.avgFreightEstimate.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 flex gap-2">
                    <button
                      onClick={() => navigate('/calculator')}
                      className="flex-1 flex items-center justify-center gap-1 rounded bg-slate-900 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800"
                    >
                      <Calculator className="h-3 w-3" />
                      <span>Model Economics</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
