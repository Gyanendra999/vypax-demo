import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Ship,
  Search,
  Filter,
  Plus,
  ChevronRight,
  ArrowRight,
  Anchor,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { tradeService } from '../services/tradeService';
import { Shipment, ShipmentStatus } from '../types/trade';
import { StatusBadge } from '../components/common/StatusBadge';

export const ShipmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { openNewShipment } = useOutletContext<{ openNewShipment: () => void }>();

  const [shipments, setShipments] = useState<Shipment[]>(tradeService.getShipments());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('All');

  useEffect(() => {
    const unsub = tradeService.subscribe(() => {
      setShipments(tradeService.getShipments());
    });
    return unsub;
  }, []);

  const tabs = [
    'All',
    'In Transit',
    'Documentation',
    'Ready to Book',
    'Booked',
    'Exception',
    'Delivered',
  ];

  const filtered = shipments.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.cargo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.cargo.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.origin.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destination.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'All' || s.status === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-slate-800" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Shipment Operations Directory
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Monitor container bookings, CFS carting, ocean line departures, and destination handoffs.
          </p>
        </div>

        <button
          onClick={openNewShipment}
          className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Shipment</span>
        </button>
      </div>

      {/* Filter Tabs and Search Toolbar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        {/* Interactive Segmented Tabs (allowed by constitution) */}
        <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-3">
          {tabs.map((tab) => {
            const count =
              tab === 'All'
                ? shipments.length
                : shipments.filter((s) => s.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab}</span>
                <span className="font-mono text-[10px] opacity-80 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by VPX number, port, cargo category, or product description..."
            className="w-full rounded border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-medium text-slate-500">
                <th className="py-2.5 px-4 font-mono">Shipment</th>
                <th className="py-2.5 px-3">Route (Origin → Dest)</th>
                <th className="py-2.5 px-3">Cargo Spec</th>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Forwarder</th>
                <th className="py-2.5 px-3 font-mono">ETA</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Ship className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No shipments found</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Try changing your status tab or search terms, or initiate a new shipment.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/shipments/${s.id}`)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80 group"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 group-hover:text-blue-700">
                      {s.id}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">
                        {s.origin.city} → {s.destination.city}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {s.origin.port} → {s.destination.port}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{s.cargo.category}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {s.cargo.description}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {s.cargo.containerType}
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={s.status} />
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {s.carrierOrForwarder}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {s.eta}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {s.owner}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-800 inline" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
