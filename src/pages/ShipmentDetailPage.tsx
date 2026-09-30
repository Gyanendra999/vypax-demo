import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import {
  Ship,
  ArrowLeft,
  Calendar,
  Clock,
  Anchor,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { tradeService } from '../services/tradeService';
import { Shipment, TradeDocument, ShipmentStatus, DocumentType } from '../types/trade';
import { StatusBadge } from '../components/common/StatusBadge';
import { RouteVisualizer } from '../components/common/RouteVisualizer';
import { Timeline } from '../components/common/Timeline';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal';

export const ShipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useOutletContext<{ showToast: (msg: string) => void }>();

  const [shipment, setShipment] = useState<Shipment | undefined>(() =>
    id ? tradeService.getShipmentById(id) : undefined
  );

  const [previewDoc, setPreviewDoc] = useState<TradeDocument | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ShipmentStatus>(
    shipment?.status || 'In Transit'
  );
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    if (!id) return;
    const s = tradeService.getShipmentById(id);
    setShipment(s);
    if (s) setSelectedStatus(s.status);

    const unsub = tradeService.subscribe(() => {
      const refreshed = tradeService.getShipmentById(id);
      setShipment(refreshed);
      if (refreshed) setSelectedStatus(refreshed.status);
    });
    return unsub;
  }, [id]);

  if (!shipment) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Unable to load shipment</h2>
          <p className="mt-1 text-xs text-slate-500">
            Shipment "{id}" could not be retrieved from the active workspace repository.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/shipments')}
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Back to Shipments
            </button>
            <button
              onClick={() => {
                if (id) setShipment(tradeService.getShipmentById(id));
              }}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    tradeService.updateShipmentStatus(shipment.id, selectedStatus, statusNote);
    setIsUpdatingStatus(false);
    setStatusNote('');
    showToast(`Shipment ${shipment.id} status updated to ${selectedStatus}`);
  };

  const handleAdvanceMilestone = (milestoneId: string) => {
    const m = shipment.milestones.find((x) => x.id === milestoneId);
    if (m) {
      m.status = 'completed';
      m.timestamp = 'Just now (Verified)';
      // Trigger update
      tradeService.logActivity({
        shipmentId: shipment.id,
        type: 'movement',
        title: `Milestone verified for ${shipment.id}`,
        detail: `Milestone "${m.title}" logged as completed.`,
      });
      showToast(`Milestone marked as verified`);
    }
  };

  const handleGenerateDocument = (docType: DocumentType) => {
    tradeService.generateDraftDocument(shipment.id, docType);
    showToast(`Draft generated: ${docType}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back Link and Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/shipments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Shipments</span>
        </Link>

        <span className="font-mono text-[11px] text-slate-400">
          Last updated: {shipment.updatedAt}
        </span>
      </div>

      {/* Main Header Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-900">
                {shipment.id}
              </h1>
              <StatusBadge status={shipment.status} />
              <span className="font-mono text-xs text-slate-400">· Equipment: {shipment.cargo.containerType}</span>
            </div>

            <p className="mt-1.5 text-sm font-medium text-slate-800">
              {shipment.origin.city} ({shipment.origin.port}) → {shipment.destination.city} (
              {shipment.destination.port})
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{shipment.title}</p>
          </div>

          {/* Operational Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUpdatingStatus((prev) => !prev)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Update Operational Status
            </button>
          </div>
        </div>

        {/* Status Update Popdown Form */}
        {isUpdatingStatus && (
          <form
            onSubmit={handleStatusUpdate}
            className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Transition Operational State for {shipment.id}
              </span>
              <button
                type="button"
                onClick={() => setIsUpdatingStatus(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">New Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ShipmentStatus)}
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                >
                  <option value="Draft">Draft</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Ready to Book">Ready to Book</option>
                  <option value="Booked">Booked</option>
                  <option value="In Transit">In Transit</option>
                  <option value="At Port">At Port</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Exception">Exception</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  Log Entry Note / Reason
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Vessel berth confirmed, customs clearance cleared..."
                  className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Confirm Status Change
              </button>
            </div>
          </form>
        )}

        {/* Exception Note if present */}
        {shipment.exceptionNote && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <span className="font-semibold">Exception Raised: </span>
              <span>{shipment.exceptionNote}</span>
            </div>
          </div>
        )}

        {/* Key Metrics Row */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Carrier / Forwarder</span>
            <span className="font-semibold text-slate-800">{shipment.carrierOrForwarder}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Booking Reference</span>
            <span className="font-mono font-medium text-slate-800">
              {shipment.bookingReference || 'Pending allocation'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Vessel & Voyage</span>
            <span className="font-medium text-slate-800">
              {shipment.vesselName ? `${shipment.vesselName} (${shipment.voyageNumber})` : 'Feeder Assignment'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Estimated Arrival</span>
            <span className="font-mono font-semibold text-blue-700">{shipment.eta}</span>
          </div>
        </div>
      </div>

      {/* Schematic Route Visualizer (Mandatory Section 12) */}
      <RouteVisualizer shipment={shipment} />

      {/* Grid: Milestones Timeline (Left 50%) vs Trade Documents (Right 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Milestones Timeline */}
        <div className="lg:col-span-6 space-y-4">
          <Timeline
            milestones={shipment.milestones}
            onAdvanceMilestone={handleAdvanceMilestone}
          />

          {/* Cargo Particulars Box */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-xs">
            <h3 className="font-semibold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2.5 mb-3">
              Cargo & Equipment Specifications
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block">Commodity</span>
                <span className="font-medium text-slate-800">{shipment.cargo.description}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Harmonized Tariff (HS)</span>
                <span className="font-mono font-semibold text-slate-800">{shipment.cargo.hsCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Quantity & Units</span>
                <span className="font-mono font-medium text-slate-800">
                  {shipment.cargo.quantity} {shipment.cargo.unit} ({shipment.cargo.packageCount} pkgs)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Gross Weight / Volume</span>
                <span className="font-mono font-medium text-slate-800">
                  {shipment.cargo.grossWeightKg.toLocaleString()} kg · {shipment.cargo.volumeCbm} CBM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Documents List & Financial Summary */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Required Trade Documents
              </h3>
              <span className="text-[11px] text-slate-400">
                {shipment.documents.filter((d) => d.status === 'Verified').length} of{' '}
                {shipment.documents.length} verified
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {shipment.documents.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{doc.name}</span>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      Req: {doc.requiredFor} · Ref: {doc.referenceNumber || 'Draft'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {doc.status === 'Missing' ? (
                      <button
                        onClick={() => handleGenerateDocument(doc.name)}
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Generate
                      </button>
                    ) : (
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3 w-3 text-slate-500" />
                        <span>Inspect</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financials Breakdown */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-xs">
            <h3 className="font-semibold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2.5 mb-3">
              Shipment Commercials & Landed Costs
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Declared Cargo Value</span>
                <span className="font-mono font-medium text-slate-800">
                  ${shipment.financials.declaredValueUsd.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Freight</span>
                <span className="font-mono font-medium text-slate-800">
                  ${shipment.financials.freightCostUsd.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marine Insurance</span>
                <span className="font-mono font-medium text-slate-800">
                  ${shipment.financials.insuranceCostUsd.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Destination Duty</span>
                <span className="font-mono font-medium text-slate-800">
                  ${shipment.financials.estimatedDutyUsd.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                <span className="text-slate-900">Total CIF Landed Value</span>
                <span className="font-mono text-slate-900">
                  $
                  {(
                    shipment.financials.declaredValueUsd +
                    shipment.financials.freightCostUsd +
                    shipment.financials.insuranceCostUsd +
                    shipment.financials.estimatedDutyUsd +
                    shipment.financials.otherChargesUsd
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specimen Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          shipment={shipment}
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onMarkVerified={(docId) => {
            tradeService.updateDocumentStatus(shipment.id, docId, 'Verified', 'Customs / Operations');
            showToast('Document marked as Verified');
          }}
        />
      )}
    </div>
  );
};
