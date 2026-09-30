import React from 'react';
import { ShipmentStatus, DocumentStatus } from '../../types/trade';

interface StatusBadgeProps {
  status: ShipmentStatus | DocumentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'In Transit':
        return {
          dotClass: 'bg-blue-600',
          textColor: 'text-blue-900',
          label: 'In Transit',
        };
      case 'Documentation':
        return {
          dotClass: 'bg-indigo-600',
          textColor: 'text-indigo-900',
          label: 'Documentation',
        };
      case 'Ready to Book':
        return {
          dotClass: 'bg-amber-600',
          textColor: 'text-amber-900',
          label: 'Ready to Book',
        };
      case 'Booked':
        return {
          dotClass: 'bg-teal-600',
          textColor: 'text-teal-900',
          label: 'Booked',
        };
      case 'Preparing':
      case 'Draft':
        return {
          dotClass: 'bg-slate-400',
          textColor: 'text-slate-700',
          label: status,
        };
      case 'Under Review':
        return {
          dotClass: 'bg-amber-500',
          textColor: 'text-amber-800',
          label: 'Under Review',
        };
      case 'Verified':
      case 'Delivered':
        return {
          dotClass: 'bg-emerald-600',
          textColor: 'text-emerald-900',
          label: status,
        };
      case 'At Port':
        return {
          dotClass: 'bg-purple-600',
          textColor: 'text-purple-900',
          label: 'At Port',
        };
      case 'Exception':
      case 'Missing':
        return {
          dotClass: 'bg-red-600',
          textColor: 'text-red-900',
          label: status,
        };
      default:
        return {
          dotClass: 'bg-slate-400',
          textColor: 'text-slate-700',
          label: status,
        };
    }
  };

  const config = getStatusConfig();
  const textClass = size === 'sm' ? 'text-xs' : 'text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 ${textClass} ${config.textColor}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
    </span>
  );
};
