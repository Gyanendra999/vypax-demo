import React from 'react';
import { X, Printer, Download, CheckCircle, FileText } from 'lucide-react';
import { Shipment, TradeDocument } from '../../types/trade';
import { DEMO_COMPANY } from '../../data/mockData';

interface DocumentPreviewModalProps {
  shipment: Shipment;
  document: TradeDocument;
  onClose: () => void;
  onMarkVerified?: (docId: string) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  shipment,
  document,
  onClose,
  onMarkVerified,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-700" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {document.name} · {shipment.id}
              </h3>
              <p className="text-[11px] text-slate-500">
                Status: <span className="font-medium text-slate-700">{document.status}</span> · Ref:{' '}
                {document.referenceNumber || 'Generated Draft'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {document.status !== 'Verified' && onMarkVerified && (
              <button
                onClick={() => {
                  onMarkVerified(document.id);
                  onClose();
                }}
                className="flex items-center gap-1 rounded border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Mark Verified</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title="Print document"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Realistic B2B Trade Document Sheet Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          <div className="mx-auto max-w-2xl rounded border border-slate-300 bg-white p-6 shadow-xs text-xs font-sans text-slate-800">
            {/* Watermark / Disclaimer Banner */}
            <div className="mb-4 border-b border-amber-200 bg-amber-50 p-2 text-center text-[10px] text-amber-800 font-mono">
              DEMO TRADE SPECIMEN · PREPARED IN VYPAX WORKSPACE · FOR OPERATIONAL PLANNING
            </div>

            {/* Document Header */}
            <div className="flex justify-between border-b-2 border-slate-800 pb-4">
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight uppercase">
                  {document.name}
                </h1>
                <p className="font-mono text-[11px] text-slate-500">
                  Document No: {document.referenceNumber || `VYP-${shipment.id}-DOC`}
                </p>
                <p className="font-mono text-[11px] text-slate-500">
                  Date: {document.updatedAt || 'Current'}
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900">{DEMO_COMPANY.name}</span>
                <p className="text-[11px] text-slate-500">IEC: {DEMO_COMPANY.iecNumber}</p>
                <p className="text-[11px] text-slate-500">GSTIN: {DEMO_COMPANY.gstin}</p>
                <p className="text-[11px] text-slate-500">Mumbai Industrial Corridor, IN</p>
              </div>
            </div>

            {/* Parties Matrix */}
            <div className="mt-4 grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
              <div className="rounded border border-slate-200 p-2.5">
                <span className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider">
                  Exporter / Shipper
                </span>
                <p className="mt-1 font-medium">{DEMO_COMPANY.name}</p>
                <p className="text-slate-500 text-[11px]">
                  JNPT Port Authorized Logistics Terminal
                </p>
                <p className="text-slate-500 text-[11px]">Contact: {DEMO_COMPANY.currentUser.name}</p>
              </div>

              <div className="rounded border border-slate-200 p-2.5">
                <span className="font-semibold text-slate-900 text-[11px] uppercase tracking-wider">
                  Consignee / Importer
                </span>
                <p className="mt-1 font-medium">Al Futtaim Industrial Trading LLC</p>
                <p className="text-slate-500 text-[11px]">
                  Plot 14-B, Jebel Ali Free Zone, Dubai, UAE
                </p>
                <p className="text-slate-500 text-[11px]">TRN: 100294810200003</p>
              </div>
            </div>

            {/* Transport & Routing Details */}
            <div className="mt-4 grid grid-cols-4 gap-2 border-b border-slate-200 pb-3 text-[11px]">
              <div>
                <span className="text-slate-400">Pre-Carriage by:</span>
                <p className="font-medium text-slate-800">Road Haulage</p>
              </div>
              <div>
                <span className="text-slate-400">Port of Loading:</span>
                <p className="font-medium text-slate-800">{shipment.origin.port}</p>
              </div>
              <div>
                <span className="text-slate-400">Port of Discharge:</span>
                <p className="font-medium text-slate-800">{shipment.destination.port}</p>
              </div>
              <div>
                <span className="text-slate-400">Final Destination:</span>
                <p className="font-medium text-slate-800">{shipment.destination.city}</p>
              </div>
              <div className="mt-2">
                <span className="text-slate-400">Vessel / Voyage:</span>
                <p className="font-medium text-slate-800">
                  {shipment.vesselName || 'Feeder Space'} {shipment.voyageNumber || ''}
                </p>
              </div>
              <div className="mt-2">
                <span className="text-slate-400">Terms of Delivery:</span>
                <p className="font-medium text-slate-800">CIF {shipment.destination.city}</p>
              </div>
              <div className="mt-2">
                <span className="text-slate-400">Container / Equipment:</span>
                <p className="font-mono text-slate-800">{shipment.cargo.containerType}</p>
              </div>
              <div className="mt-2">
                <span className="text-slate-400">Currency of Sale:</span>
                <p className="font-mono font-medium text-slate-800">
                  {shipment.financials.currency}
                </p>
              </div>
            </div>

            {/* Cargo Particulars Table */}
            <div className="mt-4">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-50 text-[11px] font-semibold text-slate-900">
                    <th className="py-2 px-2">Item / Marks</th>
                    <th className="py-2 px-2">HS Code</th>
                    <th className="py-2 px-2">Description</th>
                    <th className="py-2 px-2 text-right">Quantity</th>
                    <th className="py-2 px-2 text-right">Rate (USD)</th>
                    <th className="py-2 px-2 text-right">Amount (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 px-2 font-sans">
                      <span className="font-medium text-slate-900">01</span>
                      <p className="text-[10px] text-slate-400">PKG: 1-{shipment.cargo.packageCount}</p>
                    </td>
                    <td className="py-2.5 px-2">{shipment.cargo.hsCode}</td>
                    <td className="py-2.5 px-2 font-sans font-medium text-slate-800">
                      {shipment.cargo.description}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {shipment.cargo.quantity} {shipment.cargo.unit}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {(shipment.financials.declaredValueUsd / (shipment.cargo.quantity || 1)).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold">
                      ${shipment.financials.declaredValueUsd.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="py-1.5 px-2 font-sans text-slate-500 text-right">
                      Freight (Ocean Carriage):
                    </td>
                    <td className="py-1.5 px-2 text-right font-medium">
                      ${shipment.financials.freightCostUsd.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td colSpan={5} className="py-1.5 px-2 font-sans text-slate-500 text-right">
                      Marine Cargo Insurance:
                    </td>
                    <td className="py-1.5 px-2 text-right font-medium">
                      ${shipment.financials.insuranceCostUsd.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-800 font-semibold text-slate-900">
                    <td colSpan={5} className="py-2 px-2 font-sans text-right">
                      Total Invoice Value (CIF):
                    </td>
                    <td className="py-2 px-2 text-right text-xs">
                      $
                      {(
                        shipment.financials.declaredValueUsd +
                        shipment.financials.freightCostUsd +
                        shipment.financials.insuranceCostUsd
                      ).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Declaration & Signature Block */}
            <div className="mt-8 flex justify-between border-t border-slate-200 pt-4">
              <div className="max-w-xs text-[10px] text-slate-500">
                <p className="font-semibold text-slate-700">Declaration:</p>
                <p className="mt-1">
                  We declare that this invoice shows the actual price of the goods described and that
                  all particulars are true and correct.
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-semibold text-slate-900">
                  For {DEMO_COMPANY.name}
                </p>
                <div className="my-3 inline-block rounded border border-dashed border-slate-300 px-4 py-2 font-mono text-[10px] text-slate-400">
                  [DIGITALLY SIGNED VIA VYPAX]
                </div>
                <p className="text-[11px] text-slate-600">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 rounded-b-lg">
          <span className="text-[11px] text-slate-500">
            Document verified under Indian Foreign Trade Policy & Customs regulations.
          </span>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
