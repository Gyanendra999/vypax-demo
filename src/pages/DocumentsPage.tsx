import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  FileText,
  FileCheck,
  Plus,
  Eye,
  CheckCircle,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { tradeService } from '../services/tradeService';
import { TradeDocument, Shipment, DocumentType, DocumentStatus } from '../types/trade';
import { StatusBadge } from '../components/common/StatusBadge';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal';

export const DocumentsPage: React.FC = () => {
  const { showToast } = useOutletContext<{ showToast: (msg: string) => void }>();
  const [shipments, setShipments] = useState<Shipment[]>(tradeService.getShipments());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<{ doc: TradeDocument; shipment: Shipment } | null>(
    null
  );

  // Flatten all documents across shipments
  const allDocs: { doc: TradeDocument; shipment: Shipment }[] = [];
  shipments.forEach((s) => {
    s.documents.forEach((d) => {
      allDocs.push({ doc: d, shipment: s });
    });
  });

  const filteredDocs = allDocs.filter(({ doc, shipment }) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.referenceNumber && doc.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'All' || doc.status === selectedStatus;
    const matchesShipment = selectedShipmentId === 'All' || shipment.id === selectedShipmentId;

    return matchesSearch && matchesStatus && matchesShipment;
  });

  const handleGenerateDraft = (shipmentId: string, docType: DocumentType) => {
    const updated = tradeService.generateDraftDocument(shipmentId, docType);
    if (updated) {
      setShipments(tradeService.getShipments());
      showToast(`Draft generated: ${docType} for ${shipmentId}`);
    }
  };

  const handleMarkVerified = (shipmentId: string, docId: string) => {
    tradeService.updateDocumentStatus(shipmentId, docId, 'Verified', 'Customs Officer / Lead');
    setShipments(tradeService.getShipments());
    showToast('Document marked as Verified');
  };

  // Status counts
  const verifiedCount = allDocs.filter((d) => d.doc.status === 'Verified').length;
  const reviewCount = allDocs.filter((d) => d.doc.status === 'Under Review').length;
  const draftCount = allDocs.filter((d) => d.doc.status === 'Draft').length;
  const missingCount = allDocs.filter((d) => d.doc.status === 'Missing').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-800" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Trade Documents Workspace
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Repository for commercial invoices, packing lists, shipping bills, origin certificates,
            and ocean bills of lading.
          </p>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span>Demo Document Repository</span>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <span className="text-slate-500 block">Verified Compliance</span>
          <span className="font-mono text-lg font-bold text-emerald-800 tabular-nums">
            {verifiedCount}
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <span className="text-slate-500 block">Under Review</span>
          <span className="font-mono text-lg font-bold text-amber-800 tabular-nums">
            {reviewCount}
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <span className="text-slate-500 block">Drafted</span>
          <span className="font-mono text-lg font-bold text-slate-700 tabular-nums">
            {draftCount}
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <span className="text-slate-500 block">Missing / Required</span>
          <span className="font-mono text-lg font-bold text-red-700 tabular-nums">
            {missingCount}
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search document name, shipment ID, or reference number..."
              className="w-full rounded border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedShipmentId}
              onChange={(e) => setSelectedShipmentId(e.target.value)}
              className="w-full sm:w-auto rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-hidden"
            >
              <option value="All">All Shipments</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} ({s.cargo.category})
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Under Review">Under Review</option>
              <option value="Draft">Draft</option>
              <option value="Missing">Missing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Directory Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-medium text-slate-500">
                <th className="py-2.5 px-4 font-mono">Shipment</th>
                <th className="py-2.5 px-3">Document Title</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Reference No.</th>
                <th className="py-2.5 px-3">Required For</th>
                <th className="py-2.5 px-3">Last Updated</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No trade documents match current filters.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(({ doc, shipment }) => (
                  <tr key={`${shipment.id}-${doc.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      <Link
                        to={`/shipments/${shipment.id}`}
                        className="text-blue-700 hover:underline"
                      >
                        {shipment.id}
                      </Link>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{doc.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {shipment.cargo.category} · {shipment.destination.city}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={doc.status} />
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {doc.referenceNumber || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {doc.requiredFor}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {doc.updatedAt}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.status === 'Missing' ? (
                          <button
                            onClick={() => handleGenerateDraft(shipment.id, doc.name)}
                            className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Generate Draft</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setPreviewDoc({ doc, shipment })}
                              className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                              title="Preview Document"
                            >
                              <Eye className="h-3 w-3 text-slate-500" />
                              <span>Preview</span>
                            </button>

                            {doc.status !== 'Verified' && (
                              <button
                                onClick={() => handleMarkVerified(shipment.id, doc.id)}
                                className="flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
                                title="Verify document"
                              >
                                <CheckCircle className="h-3 w-3 text-emerald-600" />
                                <span>Verify</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Specimen Viewer Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          shipment={previewDoc.shipment}
          document={previewDoc.doc}
          onClose={() => setPreviewDoc(null)}
          onMarkVerified={(docId) => handleMarkVerified(previewDoc.shipment.id, docId)}
        />
      )}
    </div>
  );
};
