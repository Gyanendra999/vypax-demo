import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Calculator,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  Copy,
  Ship,
} from 'lucide-react';
import {
  calculateLandedCost,
  CALCULATION_PRESETS,
  CalculatorInput,
} from '../services/calculatorService';
import { tradeService } from '../services/tradeService';

export const CalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useOutletContext<{ showToast: (msg: string) => void }>();

  const [input, setInput] = useState<CalculatorInput>(CALCULATION_PRESETS[0]);

  const calculation = calculateLandedCost(input);

  const handlePresetSelect = (preset: CalculatorInput) => {
    setInput(preset);
    showToast(`Loaded preset: ${preset.productName}`);
  };

  const handleCreateShipment = () => {
    const created = tradeService.createShipment({
      title: `${input.productName} Consignment`,
      cargoDescription: input.productName,
      category: 'Engineering Components',
      hsCode: input.hsCode,
      quantity: input.quantity,
      unit: 'Units',
      originCity: input.origin.split(' ')[0] || 'Mumbai',
      originCountry: 'India',
      originPort: input.origin,
      destCity: input.destination.split(',')[0] || 'Dubai',
      destCountry: input.destination.includes('AE')
        ? 'United Arab Emirates'
        : input.destination.includes('DE')
        ? 'Germany'
        : 'United States',
      destPort: input.destination,
      containerType: input.quantity > 800 ? '40FT High Cube' : '20FT Standard',
      freightCostUsd: input.freightCost,
      declaredValueUsd: calculation.productValue,
      targetRevenueUsd: calculation.expectedRevenue,
    });

    showToast(`Shipment ${created.id} initiated from calculation`);
    navigate(`/shipments/${created.id}`);
  };

  const handleCopySummary = () => {
    const summary = `VYPAX LANDED COST ESTIMATE (DEMO)\nProduct: ${input.productName} (HS ${input.hsCode})\nQuantity: ${input.quantity} units @ $${input.unitPrice}/unit = $${calculation.productValue.toLocaleString()}\nFreight: $${input.freightCost.toLocaleString()} | Insurance: $${input.insuranceCost.toLocaleString()}\nEst. Duty: $${calculation.dutyAmount.toFixed(2)} (${input.dutyRatePercent}%)\nTotal Est. Landed Cost: $${calculation.totalLandedCost.toFixed(2)} ($${calculation.costPerUnit.toFixed(2)}/unit)\nExpected Revenue: $${calculation.expectedRevenue.toLocaleString()} | Est. Gross Profit: $${calculation.estimatedGrossMarginUsd.toFixed(2)} (${calculation.estimatedGrossMarginPercent.toFixed(1)}%)`;

    navigator.clipboard.writeText(summary);
    showToast('Calculation summary copied to clipboard');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-slate-800" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Trade Cost Calculator
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Estimate the landed economics of a shipment before you commit.
          </p>
        </div>

        {/* Presets Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Load Preset:</span>
          {CALCULATION_PRESETS.map((p, idx) => (
            <button
              key={p.productName}
              onClick={() => handlePresetSelect(p)}
              className={`rounded border px-2.5 py-1 transition-colors ${
                input.productName === p.productName
                  ? 'border-slate-800 bg-slate-900 text-white font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Preset {idx + 1} ({p.destination.split(',')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Inputs (Left 55%) vs Transparent Breakdown & Output (Right 45%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5">
              Commercial & Cargo Parameters
            </h2>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Product Description
              </label>
              <input
                type="text"
                value={input.productName}
                onChange={(e) => setInput({ ...input, productName: e.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  HS Code
                </label>
                <input
                  type="text"
                  value={input.hsCode}
                  onChange={(e) => setInput({ ...input, hsCode: e.target.value })}
                  className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={input.quantity}
                  onChange={(e) => setInput({ ...input, quantity: Number(e.target.value) })}
                  className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Unit Price (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={input.unitPrice}
                  onChange={(e) => setInput({ ...input, unitPrice: Number(e.target.value) })}
                  className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Origin (Port / City)
                </label>
                <input
                  type="text"
                  value={input.origin}
                  onChange={(e) => setInput({ ...input, origin: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Destination (Port / Country)
                </label>
                <input
                  type="text"
                  value={input.destination}
                  onChange={(e) => setInput({ ...input, destination: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Logistics & Tariff Costs */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5">
              Freight, Duties & Port Charges
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Freight Cost (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  value={input.freightCost}
                  onChange={(e) => setInput({ ...input, freightCost: Number(e.target.value) })}
                  className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Insurance (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  value={input.insuranceCost}
                  onChange={(e) => setInput({ ...input, insuranceCost: Number(e.target.value) })}
                  className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Duty Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={input.dutyRatePercent}
                  onChange={(e) => setInput({ ...input, dutyRatePercent: Number(e.target.value) })}
                  className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Other Charges (THC / CFS / Handling)
                </label>
                <input
                  type="number"
                  min="0"
                  value={input.otherPortCharges}
                  onChange={(e) =>
                    setInput({ ...input, otherPortCharges: Number(e.target.value) })
                  }
                  className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Target Selling Price / Unit (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={input.targetSellingPricePerUnit}
                  onChange={(e) =>
                    setInput({ ...input, targetSellingPricePerUnit: Number(e.target.value) })
                  }
                  className="w-full font-mono rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Column (Transparent Breakdown) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Landed Economics Breakdown
              </h2>
              <span className="font-mono text-[10px] text-slate-400">
                USD Tabular Breakdown
              </span>
            </div>

            {/* Formula rows */}
            <div className="divide-y divide-slate-100 text-xs mt-3">
              <div className="py-2 flex justify-between">
                <span className="text-slate-600">Product Value ({input.quantity} × ${input.unitPrice})</span>
                <span className="font-mono font-medium text-slate-900">
                  ${calculation.productValue.toLocaleString()}
                </span>
              </div>

              <div className="py-2 flex justify-between">
                <span className="text-slate-600">+ Freight (Ocean / Carrier)</span>
                <span className="font-mono font-medium text-slate-900">
                  ${calculation.freightCost.toLocaleString()}
                </span>
              </div>

              <div className="py-2 flex justify-between">
                <span className="text-slate-600">+ Marine Cargo Insurance</span>
                <span className="font-mono font-medium text-slate-900">
                  ${calculation.insuranceCost.toLocaleString()}
                </span>
              </div>

              <div className="py-2 flex justify-between bg-slate-50/60 px-1 rounded">
                <span className="text-slate-500 font-mono text-[11px]">
                  = CIF Customs Basis
                </span>
                <span className="font-mono text-[11px] text-slate-700">
                  ${(calculation.productValue + calculation.freightCost + calculation.insuranceCost).toLocaleString()}
                </span>
              </div>

              <div className="py-2 flex justify-between">
                <span className="text-slate-600">
                  + Estimated Customs Duty ({input.dutyRatePercent}%)
                </span>
                <span className="font-mono font-medium text-slate-900">
                  ${calculation.dutyAmount.toFixed(2)}
                </span>
              </div>

              <div className="py-2 flex justify-between">
                <span className="text-slate-600">+ Other Port & Clearing Charges</span>
                <span className="font-mono font-medium text-slate-900">
                  ${calculation.otherPortCharges.toLocaleString()}
                </span>
              </div>

              {/* Total Landed Cost */}
              <div className="py-3 flex justify-between items-baseline border-t-2 border-slate-800 font-semibold">
                <span className="text-slate-900">Estimated Landed Cost</span>
                <span className="font-mono text-base text-slate-900 tabular-nums">
                  ${calculation.totalLandedCost.toFixed(2)}
                </span>
              </div>

              {/* Unit Economics */}
              <div className="py-2 flex justify-between text-[11px] text-slate-500">
                <span>Cost per Unit</span>
                <span className="font-mono font-medium text-slate-800">
                  ${calculation.costPerUnit.toFixed(2)} / unit
                </span>
              </div>

              <div className="py-2 flex justify-between text-[11px] text-slate-500">
                <span>Target Selling Price</span>
                <span className="font-mono font-medium text-slate-800">
                  ${input.targetSellingPricePerUnit.toFixed(2)} / unit
                </span>
              </div>

              {/* Revenue & Margin Box */}
              <div className="pt-3 pb-1">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-600">Expected Total Revenue</span>
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      ${calculation.expectedRevenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-800">
                      Estimated Gross Profit
                    </span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        calculation.estimatedGrossMarginUsd >= 0
                          ? 'text-emerald-700'
                          : 'text-red-700'
                      }`}
                    >
                      ${calculation.estimatedGrossMarginUsd.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 text-xs">
                    <span className="text-slate-600">Estimated Gross Margin</span>
                    <span
                      className={`font-mono font-semibold ${
                        calculation.estimatedGrossMarginPercent >= 15
                          ? 'text-emerald-700'
                          : calculation.estimatedGrossMarginPercent > 0
                          ? 'text-blue-700'
                          : 'text-red-700'
                      }`}
                    >
                      {calculation.estimatedGrossMarginPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Regulatory Disclaimer Mandatory Label */}
            <div className="mt-4 rounded bg-amber-50/70 border border-amber-200 p-2.5 text-[11px] text-amber-900 leading-normal">
              <span className="font-semibold">Demo estimate: </span>
              Illustrative calculation for operational workflow planning. Does not constitute an
              official tariff quote or legal customs declaration.
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-5 space-y-2">
              <button
                onClick={handleCreateShipment}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
              >
                <Ship className="h-4 w-4" />
                <span>Create Shipment from this Calculation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={handleCopySummary}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy Calculation Summary</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
