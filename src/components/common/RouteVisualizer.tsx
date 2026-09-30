import React from 'react';
import { Anchor, Navigation, ArrowRight } from 'lucide-react';
import { Shipment } from '../../types/trade';

interface RouteVisualizerProps {
  shipment: Shipment;
}

export const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ shipment }) => {
  const isTransit = shipment.status === 'In Transit';
  const isDelivered = shipment.status === 'Delivered';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-blue-600" />
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Maritime Route Schematic
          </h3>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Demo route visualization · Not live AIS feed
        </span>
      </div>

      {/* Schematic corridor diagram */}
      <div className="relative mt-6 px-4 py-3">
        {/* Route Line */}
        <div className="absolute top-1/2 left-10 right-10 -translate-y-1/2 border-t-2 border-dashed border-slate-300" />

        <div className="relative flex items-center justify-between">
          {/* Origin Node */}
          <div className="flex flex-col items-center text-center">
            <div className="z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-800 bg-white text-slate-800 shadow-xs">
              <Anchor className="h-4 w-4" />
            </div>
            <div className="mt-2">
              <span className="font-mono text-xs font-semibold text-slate-900">
                {shipment.origin.code}
              </span>
              <p className="text-xs font-medium text-slate-700">{shipment.origin.city}</p>
              <p className="text-[11px] text-slate-500">{shipment.origin.port}</p>
              <span className="mt-1 inline-block font-mono text-[10px] text-slate-400">
                ETD: {shipment.etd}
              </span>
            </div>
          </div>

          {/* Sea Corridor / Midpoint Waypoint */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border ${
                isTransit
                  ? 'border-blue-600 bg-blue-600 text-white shadow-xs animate-pulse'
                  : isDelivered
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-300 bg-slate-100 text-slate-500'
              }`}
            >
              <ShipmentIcon isTransit={isTransit} />
            </div>
            <div className="mt-2">
              <span className="text-xs font-semibold text-slate-800">
                {isTransit ? 'Sea Transit' : isDelivered ? 'Voyage Complete' : 'Berth Staging'}
              </span>
              <p className="text-[11px] text-slate-500">
                {shipment.vesselName ? `${shipment.vesselName} (${shipment.voyageNumber})` : 'Ocean Carrier Feeder'}
              </p>
              <span className="font-mono text-[10px] text-blue-600">
                {isTransit ? 'In Transit Leg' : shipment.status}
              </span>
            </div>
          </div>

          {/* Destination Node */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                isDelivered
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-slate-800 bg-white text-slate-800'
              } shadow-xs`}
            >
              <Anchor className="h-4 w-4" />
            </div>
            <div className="mt-2">
              <span className="font-mono text-xs font-semibold text-slate-900">
                {shipment.destination.code}
              </span>
              <p className="text-xs font-medium text-slate-700">{shipment.destination.city}</p>
              <p className="text-[11px] text-slate-500">{shipment.destination.port}</p>
              <span className="mt-1 inline-block font-mono text-[10px] text-slate-400">
                ETA: {shipment.eta}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Corridor Specifications footer */}
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-4">
        <div>
          <span className="text-[11px] text-slate-400">Carrier / Forwarder</span>
          <p className="font-medium text-slate-800">{shipment.carrierOrForwarder}</p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400">Booking Reference</span>
          <p className="font-mono text-xs text-slate-800">
            {shipment.bookingReference || 'Pending allocation'}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400">Equipment Spec</span>
          <p className="font-medium text-slate-800">{shipment.cargo.containerType}</p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400">Transit Status</span>
          <p className="flex items-center gap-1 font-medium text-slate-800">
            <span>{shipment.status}</span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
          </p>
        </div>
      </div>
    </div>
  );
};

const ShipmentIcon: React.FC<{ isTransit: boolean }> = ({ isTransit }) => {
  return (
    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.32-.42-.6-.47L20 13V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v7l-1.29.23c-.27.05-.49.22-.6.47s-.13.52-.06.78L3.95 19zM6 6h12v7l-6-1.5L6 13V6z" />
    </svg>
  );
};
