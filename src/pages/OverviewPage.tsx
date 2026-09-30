import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import {
  Ship,
  Clock,
  AlertTriangle,
  FileCheck2,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Plus,
  Calculator,
  Compass,
} from 'lucide-react';
import { tradeService } from '../services/tradeService';
import { Shipment, ActivityEvent } from '../types/trade';
import { StatusBadge } from '../components/common/StatusBadge';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { openNewShipment } = useOutletContext<{
    openNewShipment: () => void;
    showToast: (msg: string) => void;
  }>();

  const [shipments, setShipments] = useState<Shipment[]>(tradeService.getShipments());
  const [activities, setActivities] = useState<ActivityEvent[]>(tradeService.getActivities());

  useEffect(() => {
    const unsub = tradeService.subscribe(() => {
      setShipments(tradeService.getShipments());
      setActivities(tradeService.getActivities());
    });
    return unsub;
  }, []);

  // Compute dynamic KPI metrics
  const totalShipments = shipments.length;
  const inTransitCount = shipments.filter((s) => s.status === 'In Transit').length;
  const inPrepCount = shipments.filter((s) =>
    ['Draft', 'Preparing', 'Documentation', 'Ready to Book'].includes(s.status)
  ).length;
  const exceptionCount = shipments.filter((s) => s.status === 'Exception').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Good morning, Operations
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Here's what's happening across your trade operations today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/calculator"
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <Calculator className="h-3.5 w-3.5 text-slate-500" />
            <span>Cost Calculator</span>
          </Link>

          <button
            onClick={openNewShipment}
            className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Shipment</span>
          </button>
        </div>
      </div>

      {/* KPI Row (Clean tabular stats, single elevation, no nested card slop) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Active Shipments</span>
            <Ship className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalShipments}
            </span>
            <span className="text-[11px] text-slate-400">across 5 corridors</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">In Preparation</span>
            <FileCheck2 className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {inPrepCount}
            </span>
            <span className="text-[11px] text-slate-400">awaiting clearance/booking</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">In Transit</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-blue-900 tabular-nums">
              {inTransitCount}
            </span>
            <span className="text-[11px] text-blue-600 font-medium">on schedule</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Exceptions</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-amber-900 tabular-nums">
              {exceptionCount}
            </span>
            <span className="text-[11px] text-amber-700">requiring action</span>
          </div>
        </div>
      </div>

      {/* Exception Alert Banner (if exceptions exist) */}
      {exceptionCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <span className="font-semibold">Port Congestion Delay on VPX-24021: </span>
              <span>
                Mundra feeder berth rolling has delayed departure by 48 hours. Customs validity
                re-check advised.
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/shipments/VPX-24021')}
            className="shrink-0 font-medium underline hover:text-amber-950"
          >
            Review Exception Details →
          </button>
        </div>
      )}

      {/* Layout Grid: Active Shipments Table (Main 2/3) + Activity & Milestones (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2/3: Active Shipments Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-slate-700" />
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Active Shipments
                </h2>
              </div>
              <Link
                to="/shipments"
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <span>View All ({shipments.length})</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-medium text-slate-500">
                    <th className="py-2.5 px-4 font-mono">Shipment</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Cargo Category</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">ETA</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shipments.slice(0, 6).map((s) => (
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
                          {s.origin.code} · {s.destination.code}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="truncate block max-w-[140px]">{s.cargo.category}</span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {s.eta}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {s.owner}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-slate-400 group-hover:text-slate-700">
                          <ChevronRight className="h-4 w-4 inline" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 text-center">
              <span className="text-[11px] text-slate-400">
                Click any shipment row to inspect operational milestones, route schematics, and trade documents.
              </span>
            </div>
          </div>

          {/* Quick Trade Discovery Teaser */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-700">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  Explore High-Margin Trade Corridors
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Analyze demand for engineering components, industrial textiles, and automotive
                  subassemblies in UAE, Germany, and the US.
                </p>
              </div>
            </div>
            <Link
              to="/opportunities"
              className="shrink-0 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Browse Opportunities →
            </Link>
          </div>
        </div>

        {/* Right 1/3: Operational Event Feed & Upcoming Milestones */}
        <div className="space-y-4">
          {/* Operations Activity Log */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Operational Event Log
              </h2>
              <Link to="/activity" className="text-[11px] font-medium text-slate-500 hover:text-slate-800">
                History
              </Link>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="p-2.5 text-xs hover:bg-slate-50/60 rounded">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[10px] text-slate-400">{act.timeDisplay}</span>
                    {act.shipmentId && (
                      <Link
                        to={`/shipments/${act.shipmentId}`}
                        className="font-mono text-[10px] font-semibold text-blue-700 hover:underline"
                      >
                        {act.shipmentId}
                      </Link>
                    )}
                  </div>
                  <h4 className="mt-1 font-semibold text-slate-800 leading-snug">{act.title}</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">{act.detail}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 p-2.5 text-center">
              <Link
                to="/activity"
                className="text-xs font-medium text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
              >
                <span>View Full Activity Feed</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Upcoming Vessel Milestones Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Imminent Vessel Cut-offs
              </h3>
              <Clock className="h-3.5 w-3.5 text-slate-400" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="border-l-2 border-blue-600 pl-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-slate-800">VPX-24017 · Port Arrival</span>
                  <span className="font-mono text-[10px] text-blue-600 font-medium">Oct 04</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  MV Arabian Bridge arriving Jebel Ali Terminal 2. Customs gate pass ready.
                </p>
              </div>

              <div className="border-l-2 border-indigo-600 pl-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-slate-800">VPX-24018 · Gate-in Cutoff</span>
                  <span className="font-mono text-[10px] text-indigo-600 font-medium">Oct 02</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  JNPT CFS stuffing window closes 18:00 for CMA CGM Palais.
                </p>
              </div>

              <div className="border-l-2 border-slate-300 pl-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-slate-800">VPX-24019 · Space Reservation</span>
                  <span className="font-mono text-[10px] text-slate-500">Oct 01</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Forwarder allocation confirmation required from HarborLink.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
