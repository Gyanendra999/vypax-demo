import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Calculator,
  FileText,
  Ship,
  Users,
  Activity,
  Settings,
  RotateCcw,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { DEMO_COMPANY } from '../../data/mockData';
import { tradeService } from '../../services/tradeService';

interface SidebarProps {
  onCloseMobile?: () => void;
  onResetData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, onResetData }) => {
  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/opportunities', label: 'Opportunities', icon: Compass },
    { to: '/calculator', label: 'Trade Calculator', icon: Calculator },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/shipments', label: 'Shipments', icon: Ship },
    { to: '/partners', label: 'Partners', icon: Users },
    { to: '/activity', label: 'Activity', icon: Activity },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="flex h-full w-64 flex-col justify-between border-r border-slate-200 bg-white">
      {/* Top Workspace Header */}
      <div>
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate font-medium">{DEMO_COMPANY.name}</span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                IEC: {DEMO_COMPANY.iecNumber} · {DEMO_COMPANY.portRegistration}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-0.5 p-3">
          <div className="px-2.5 py-1.5 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            Operations Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-slate-800" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100" />
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Demo Controls */}
      <div className="border-t border-slate-200 p-3">
        <div className="mb-2.5 rounded-md bg-slate-50 p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              {DEMO_COMPANY.currentUser.name}
            </span>
            <span className="font-mono text-[10px] text-slate-500">Demo User</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            {DEMO_COMPANY.currentUser.title} · {DEMO_COMPANY.currentUser.department}
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset demo shipments and activity logs to standard baseline?')) {
              tradeService.resetDemoData();
              onResetData();
            }
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Demo Workspace</span>
        </button>
      </div>
    </aside>
  );
};
