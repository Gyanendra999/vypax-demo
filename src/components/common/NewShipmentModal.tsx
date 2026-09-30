import React, { useState } from 'react';
import { X, Ship, ArrowRight } from 'lucide-react';
import { tradeService } from '../../services/tradeService';
import { useNavigate } from 'react-router-dom';

interface NewShipmentModalProps {
  onClose: () => void;
  onShipmentCreated: (id: string) => void;
  initialData?: {
    cargoDescription?: string;
    category?: string;
    hsCode?: string;
    quantity?: number;
    unit?: string;
    declaredValueUsd?: number;
    freightCostUsd?: number;
    targetRevenueUsd?: number;
    originCity?: string;
    destCity?: string;
  };
}

export const NewShipmentModal: React.FC<NewShipmentModalProps> = ({
  onClose,
  onShipmentCreated,
  initialData,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: initialData?.cargoDescription ? `${initialData.cargoDescription} Consignment` : '',
    originCity: initialData?.originCity || 'Nhava Sheva (Mumbai)',
    originCountry: 'India',
    originPort: 'Nhava Sheva Port (JNPT)',
    destCity: initialData?.destCity || 'Dubai',
    destCountry: 'United Arab Emirates',
    destPort: 'Jebel Ali Port',
    cargoDescription: initialData?.cargoDescription || 'Industrial Precision Fasteners',
    category: initialData?.category || 'Engineering Components',
    hsCode: initialData?.hsCode || '8483.40.00',
    quantity: initialData?.quantity || 500,
    unit: initialData?.unit || 'Units',
    containerType: '20FT Standard' as const,
    freightCostUsd: initialData?.freightCostUsd || 1400,
    declaredValueUsd: initialData?.declaredValueUsd || 22000,
    targetRevenueUsd: initialData?.targetRevenueUsd || 31500,
    carrierOrForwarder: 'HarborLink Logistics',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = tradeService.createShipment(formData);
    onShipmentCreated(created.id);
    onClose();
    navigate(`/shipments/${created.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Ship className="h-4 w-4 text-slate-800" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Initiate New Shipment</h2>
              <p className="text-[11px] text-slate-500">
                Setup route particulars, cargo classification, and operational owners
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Cargo Particulars */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cargo Description
            </label>
            <input
              type="text"
              required
              value={formData.cargoDescription}
              onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
              placeholder="e.g. Precision CNC Machined Pump Flanges"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Commodity Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-hidden"
              >
                <option value="Engineering Components">Engineering Components</option>
                <option value="Textile Machinery">Textile Machinery</option>
                <option value="Auto Components">Auto Components</option>
                <option value="Agri & Food Processing">Agri & Food Processing</option>
                <option value="Hardware & Fasteners">Hardware & Fasteners</option>
                <option value="Chemicals & Minerals">Chemicals & Minerals</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                HS Tariff Code
              </label>
              <input
                type="text"
                required
                value={formData.hsCode}
                onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                className="w-full font-mono rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                placeholder="e.g. 8483.40.00"
              />
            </div>
          </div>

          {/* Route particulars */}
          <div className="rounded border border-slate-200 bg-slate-50/50 p-3">
            <span className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Maritime Corridor
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Origin Port</label>
                <input
                  type="text"
                  required
                  value={formData.originPort}
                  onChange={(e) => setFormData({ ...formData, originPort: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Destination Port</label>
                <input
                  type="text"
                  required
                  value={formData.destPort}
                  onChange={(e) => setFormData({ ...formData, destPort: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Logistics & Equipment */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Equipment
              </label>
              <select
                value={formData.containerType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    containerType: e.target.value as typeof formData.containerType,
                  })
                }
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-800"
              >
                <option value="20FT Standard">20FT Standard</option>
                <option value="40FT High Cube">40FT High Cube</option>
                <option value="LCL Consolidation">LCL Consolidation</option>
                <option value="Air Cargo">Air Cargo</option>
              </select>
            </div>
          </div>

          {/* Financials & Forwarder */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Declared Cargo Value (USD)
              </label>
              <input
                type="number"
                min="0"
                value={formData.declaredValueUsd}
                onChange={(e) =>
                  setFormData({ ...formData, declaredValueUsd: Number(e.target.value) })
                }
                className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Allocated Freight (USD)
              </label>
              <input
                type="number"
                min="0"
                value={formData.freightCostUsd}
                onChange={(e) =>
                  setFormData({ ...formData, freightCostUsd: Number(e.target.value) })
                }
                className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Logistics Partner / Freight Forwarder
            </label>
            <select
              value={formData.carrierOrForwarder}
              onChange={(e) => setFormData({ ...formData, carrierOrForwarder: e.target.value })}
              className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="HarborLink Logistics">HarborLink Logistics (West Asia & US)</option>
              <option value="TransOcean Marine Express">
                TransOcean Marine Express (Europe & SEA)
              </option>
              <option value="Direct Carrier Contract">Direct Carrier Contract (Carrier Owned)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              <span>Create Shipment</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
