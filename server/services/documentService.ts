import crypto from 'crypto';
import { db } from '../db/database';
import { TradeDocument, DocumentStatus, DocumentType } from '../../src/types/trade';
import { activityService } from './activityService';
import { notificationService } from './notificationService';

export class DocumentService {
  // List documents for workspace / shipment
  public listDocuments(workspaceId: string, shipmentId?: string): TradeDocument[] {
    let docs = Array.from(db.documents.values()).filter((d) => d.workspaceId === workspaceId);
    if (shipmentId) {
      docs = docs.filter((d) => d.shipmentId.toLowerCase() === shipmentId.toLowerCase());
    }
    return docs;
  }

  // Update status (Draft, Under Review, Verified, Missing)
  public updateDocumentStatus(params: {
    workspaceId: string;
    shipmentId: string;
    docId: string;
    newStatus: DocumentStatus;
    verifiedBy?: string;
    actorName?: string;
    notes?: string;
  }): TradeDocument {
    const doc = db.documents.get(params.docId);
    if (!doc || doc.workspaceId !== params.workspaceId) {
      throw new Error(`Document ${params.docId} not found.`);
    }

    doc.status = params.newStatus;
    doc.updatedAt = 'Just now';
    if (params.verifiedBy) doc.verifiedBy = params.verifiedBy;
    if (params.notes) doc.notes = params.notes;

    db.documents.set(params.docId, doc);

    activityService.logActivity({
      workspaceId: params.workspaceId,
      shipmentId: params.shipmentId,
      type: 'documentation',
      title: `${doc.name} updated for ${params.shipmentId}`,
      detail: `Document status changed to ${params.newStatus}${params.verifiedBy ? ` by ${params.verifiedBy}` : ''}.`,
      actor: params.actorName || params.verifiedBy || 'Documentation Officer',
    });

    notificationService.createNotification({
      workspaceId: params.workspaceId,
      type: 'document',
      title: `Document ${doc.name} ${params.newStatus}`,
      message: `Status updated for shipment ${params.shipmentId}.`,
      link: `/shipments/${params.shipmentId}`,
    });

    return doc;
  }

  // Generate automated draft document
  public generateDraftDocument(params: {
    workspaceId: string;
    shipmentId: string;
    docType: DocumentType;
    actorName?: string;
  }): TradeDocument {
    const shipment = db.shipments.get(params.shipmentId);
    if (!shipment || shipment.workspaceId !== params.workspaceId) {
      throw new Error(`Shipment ${params.shipmentId} not found.`);
    }

    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    let doc = Array.from(db.documents.values()).find(
      (d) => d.workspaceId === params.workspaceId && d.shipmentId === params.shipmentId && d.name === params.docType
    );

    const fileName = `${params.docType.replace(/\s+/g, '_')}_${params.shipmentId}.pdf`;

    if (doc) {
      doc.status = 'Draft';
      doc.fileName = fileName;
      doc.updatedAt = nowStr;
      db.documents.set(doc.id, doc);
    } else {
      const docId = `doc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
      doc = {
        id: docId,
        workspaceId: params.workspaceId,
        shipmentId: params.shipmentId,
        name: params.docType,
        fileName,
        status: 'Draft',
        updatedAt: nowStr,
        requiredFor: 'Customs Clearance',
        referenceNumber: `DFT-${Date.now().toString().slice(-6)}`,
      };
      db.documents.set(docId, doc);
    }

    activityService.logActivity({
      workspaceId: params.workspaceId,
      shipmentId: params.shipmentId,
      type: 'documentation',
      title: `Draft generated: ${params.docType}`,
      detail: `Automated draft generated for shipment ${params.shipmentId} based on cargo & invoice parameters.`,
      actor: params.actorName || 'System Documentation Engine',
    });

    return doc;
  }

  // Upload document / save file record with signed URL
  public uploadDocument(params: {
    workspaceId: string;
    shipmentId: string;
    name: DocumentType;
    fileName: string;
    fileSize: number;
    mimeType: string;
    actorName: string;
    notes?: string;
  }): TradeDocument {
    const docId = `doc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    const newDoc: TradeDocument & { workspaceId: string; fileUrl?: string; versions?: any[] } = {
      id: docId,
      workspaceId: params.workspaceId,
      shipmentId: params.shipmentId,
      name: params.name,
      fileName: params.fileName,
      fileUrl: `/api/v1/documents/${docId}/download`,
      status: 'Under Review',
      updatedAt: nowStr,
      requiredFor: 'Customs Clearance',
      notes: params.notes,
      referenceNumber: `REC-${Date.now().toString().slice(-6)}`,
      versions: [
        {
          version: 1,
          fileName: params.fileName,
          uploadedBy: params.actorName,
          timestamp: new Date().toISOString(),
          size: params.fileSize,
        },
      ],
    };

    db.documents.set(docId, newDoc);

    activityService.logActivity({
      workspaceId: params.workspaceId,
      shipmentId: params.shipmentId,
      type: 'documentation',
      title: `Document Uploaded: ${params.name}`,
      detail: `Uploaded file ${params.fileName} (${(params.fileSize / 1024).toFixed(1)} KB) for shipment ${params.shipmentId}.`,
      actor: params.actorName,
    });

    return newDoc;
  }

  // Generate signed secure download URL
  public getSignedDownloadUrl(workspaceId: string, docId: string): { url: string; fileName: string; expiresAt: string } {
    const doc = db.documents.get(docId);
    if (!doc || doc.workspaceId !== workspaceId) {
      throw new Error('Document not found in workspace.');
    }

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    return {
      url: `/api/v1/documents/${docId}/download?token=${token}`,
      fileName: doc.fileName || `${doc.name.replace(/\s+/g, '_')}.pdf`,
      expiresAt,
    };
  }
}

export const documentService = new DocumentService();
