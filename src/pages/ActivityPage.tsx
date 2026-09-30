import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Filter, Clock, Ship, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import { tradeService } from '../services/tradeService';
import { ActivityEvent } from '../types/trade';

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>(tradeService.getActivities());
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    const unsub = tradeService.subscribe(() => {
      setActivities(tradeService.getActivities());
    });
    return unsub;
  }, []);

  const filtered = activities.filter((act) => {
    if (selectedType === 'all') return true;
    return act.type === selectedType;
  });

  const getIconForType = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'documentation':
        return <FileText className="h-3.5 w-3.5 text-indigo-600" />;
      case 'booking':
        return <Ship className="h-3.5 w-3.5 text-blue-600" />;
      case 'movement':
        return <Clock className="h-3.5 w-3.5 text-emerald-600" />;
      case 'exception':
        return <AlertTriangle className="h-3.5 w-3.5 text-red-600" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-800" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Operational Activity Feed
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Immutable chain-of-custody log for trade documents, booking reservations, customs filings,
            and transit milestones.
          </p>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          {['all', 'documentation', 'booking', 'movement', 'exception'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                selectedType === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No activity events recorded under this filter.
          </div>
        ) : (
          filtered.map((act) => (
            <div key={act.id} className="p-4 flex items-start gap-3.5 hover:bg-slate-50/70 transition-colors">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                {getIconForType(act.type)}
              </div>

              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{act.title}</span>
                    {act.shipmentId && (
                      <Link
                        to={`/shipments/${act.shipmentId}`}
                        className="font-mono text-[11px] font-semibold text-blue-700 hover:underline"
                      >
                        [{act.shipmentId}]
                      </Link>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {act.timeDisplay}
                  </span>
                </div>

                <p className="mt-1 text-slate-600 leading-normal">{act.detail}</p>

                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>Logged by: {act.actor}</span>
                  <span>·</span>
                  <span className="capitalize">Category: {act.type}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
