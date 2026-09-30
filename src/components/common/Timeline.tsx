import React from 'react';
import { Check, Circle, Clock } from 'lucide-react';
import { Milestone } from '../../types/trade';

interface TimelineProps {
  milestones: Milestone[];
  onAdvanceMilestone?: (milestoneId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ milestones, onAdvanceMilestone }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
          Operational Milestones & Chain of Custody
        </h3>
        <span className="text-[11px] text-slate-400">Chronological verification</span>
      </div>

      <div className="relative mt-5">
        {/* Vertical line connecting milestones */}
        <div className="absolute top-3 bottom-3 left-3 w-0.5 bg-slate-200" />

        <div className="space-y-5">
          {milestones.map((m) => {
            const isCompleted = m.status === 'completed';
            const isInProgress = m.status === 'in_progress';
            const isPending = m.status === 'pending';

            return (
              <div key={m.id} className="relative flex items-start gap-4 pl-1">
                {/* Status Node */}
                <div
                  className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-white ${
                    isCompleted
                      ? 'border-emerald-600 bg-emerald-600'
                      : isInProgress
                      ? 'border-blue-600 bg-blue-600 animate-pulse'
                      : 'border-slate-300 bg-white text-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3 stroke-[3]" />
                  ) : isInProgress ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : (
                    <Circle className="h-2 w-2 text-slate-300" />
                  )}
                </div>

                {/* Milestone Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <h4
                      className={`text-xs font-semibold ${
                        isCompleted
                          ? 'text-slate-900'
                          : isInProgress
                          ? 'text-blue-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {m.title}
                    </h4>

                    {m.timestamp && (
                      <span className="font-mono text-[11px] text-slate-400">
                        {m.timestamp}
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-slate-600">{m.description}</p>

                  <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                    {m.location && (
                      <span>
                        Location: <span className="text-slate-600">{m.location}</span>
                      </span>
                    )}
                    {isInProgress && (
                      <span className="flex items-center gap-1 font-medium text-blue-600">
                        <Clock className="h-3 w-3" /> In Progress
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Advance demo action button for in-progress or next milestone */}
                {isInProgress && onAdvanceMilestone && (
                  <button
                    onClick={() => onAdvanceMilestone(m.id)}
                    className="shrink-0 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    title="Advance to completed status"
                  >
                    Mark Verified
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
