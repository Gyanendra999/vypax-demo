import {
  Shipment,
  TradeDocument,
  ActivityEvent,
  TradeOpportunity,
  LogisticsPartner,
  ShipmentStatus,
  DocumentStatus,
  DocumentType,
} from '../types/trade';
import {
  INITIAL_SHIPMENTS,
  INITIAL_OPPORTUNITIES,
  INITIAL_PARTNERS,
  INITIAL_ACTIVITIES,
  DEMO_COMPANY,
} from '../data/mockData';

const SHIPMENTS_STORAGE_KEY = 'vypax_shipments_v1';
const ACTIVITIES_STORAGE_KEY = 'vypax_activities_v1';

class TradeService {
  private shipments: Shipment[] = [];
  private opportunities: TradeOpportunity[] = INITIAL_OPPORTUNITIES;
  private partners: LogisticsPartner[] = INITIAL_PARTNERS;
  private activities: ActivityEvent[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedShipments = localStorage.getItem(SHIPMENTS_STORAGE_KEY);
      if (storedShipments) {
        this.shipments = JSON.parse(storedShipments);
      } else {
        this.shipments = INITIAL_SHIPMENTS;
        this.saveShipments();
      }

      const storedActivities = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
      if (storedActivities) {
        this.activities = JSON.parse(storedActivities);
      } else {
        this.activities = INITIAL_ACTIVITIES;
        this.saveActivities();
      }
    } catch {
      this.shipments = INITIAL_SHIPMENTS;
      this.activities = INITIAL_ACTIVITIES;
    }
  }

  private saveShipments() {
    try {
      localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(this.shipments));
    } catch (e) {
      console.warn('Failed to persist shipments', e);
    }
  }

  private saveActivities() {
    try {
      localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(this.activities));
    } catch (e) {
      console.warn('Failed to persist activities', e);
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getShipments(): Shipment[] {
    return [...this.shipments];
  }

  public getShipmentById(id: string): Shipment | undefined {
    return this.shipments.find((s) => s.id.toLowerCase() === id.toLowerCase());
  }

  public getOpportunities(): TradeOpportunity[] {
    return [...this.opportunities];
  }

  public getPartners(): LogisticsPartner[] {
    return [...this.partners];
  }

  public getActivities(): ActivityEvent[] {
    return [...this.activities];
  }

  public getCompanyProfile() {
    return DEMO_COMPANY;
  }

  public createShipment(data: {
    title: string;
    originCity: string;
    originCountry: string;
    originPort: string;
    destCity: string;
    destCountry: string;
    destPort: string;
    cargoDescription: string;
    category: string;
    hsCode: string;
    quantity: number;
    unit: string;
    containerType: '20FT Standard' | '40FT High Cube' | 'LCL Consolidation' | 'Air Cargo';
    freightCostUsd: number;
    declaredValueUsd: number;
    targetRevenueUsd: number;
    carrierOrForwarder?: string;
  }): Shipment {
    const nextNumber = 24020 + this.shipments.length + 1;
    const newId = `VPX-${nextNumber}`;
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    const defaultMilestones = [
      {
        id: 'm1',
        title: 'Booking confirmed',
        description: 'Shipment created and awaiting booking placement',
        status: 'in_progress' as const,
        timestamp: `${nowStr} 10:00`,
        location: 'Export Operations Desk',
      },
      {
        id: 'm2',
        title: 'Cargo received at CFS',
        description: 'Factory staging and transport dispatch',
        status: 'pending' as const,
      },
      {
        id: 'm3',
        title: 'Export documentation verified',
        description: 'Invoice, packing list and shipping bill filing',
        status: 'pending' as const,
      },
      {
        id: 'm4',
        title: 'Vessel departed',
        description: 'Port terminal loading and departure',
        status: 'pending' as const,
      },
      {
        id: 'm5',
        title: 'In transit',
        description: 'Vessel transit tracking',
        status: 'pending' as const,
      },
      {
        id: 'm6',
        title: 'Port arrival',
        description: 'Destination port discharge',
        status: 'pending' as const,
      },
      {
        id: 'm7',
        title: 'Final delivery',
        description: 'Destination customs clearance & consignee receipt',
        status: 'pending' as const,
      },
    ];

    const defaultDocs: TradeDocument[] = [
      {
        id: `doc-${Date.now()}-1`,
        shipmentId: newId,
        name: 'Commercial Invoice',
        status: 'Draft',
        updatedAt: nowStr,
        requiredFor: 'Customs Clearance',
        referenceNumber: `INV/EXP/26/${nextNumber}`,
      },
      {
        id: `doc-${Date.now()}-2`,
        shipmentId: newId,
        name: 'Packing List',
        status: 'Draft',
        updatedAt: nowStr,
        requiredFor: 'Customs Clearance',
        referenceNumber: `PKL/26/${nextNumber}`,
      },
      {
        id: `doc-${Date.now()}-3`,
        shipmentId: newId,
        name: 'Shipping Bill',
        status: 'Missing',
        updatedAt: nowStr,
        requiredFor: 'Vessel Loading',
      },
      {
        id: `doc-${Date.now()}-4`,
        shipmentId: newId,
        name: 'Certificate of Origin',
        status: 'Missing',
        updatedAt: nowStr,
        requiredFor: 'Customs Clearance',
      },
      {
        id: `doc-${Date.now()}-5`,
        shipmentId: newId,
        name: 'Bill of Lading',
        status: 'Missing',
        updatedAt: nowStr,
        requiredFor: 'Delivery',
      },
    ];

    const newShipment: Shipment = {
      id: newId,
      title: data.title || `${data.cargoDescription} to ${data.destCity}`,
      origin: {
        city: data.originCity,
        country: data.originCountry,
        port: data.originPort,
        code: 'INORG',
      },
      destination: {
        city: data.destCity,
        country: data.destCountry,
        port: data.destPort,
        code: 'DDEST',
      },
      cargo: {
        description: data.cargoDescription,
        category: data.category,
        hsCode: data.hsCode,
        quantity: data.quantity,
        unit: data.unit,
        grossWeightKg: Math.round(data.quantity * 8.5),
        volumeCbm: Math.max(1, Math.round(data.quantity * 0.02 * 10) / 10),
        containerType: data.containerType,
        packageCount: Math.ceil(data.quantity / 25),
      },
      financials: {
        declaredValueUsd: data.declaredValueUsd,
        freightCostUsd: data.freightCostUsd,
        insuranceCostUsd: Math.round(data.declaredValueUsd * 0.008),
        estimatedDutyUsd: Math.round((data.declaredValueUsd + data.freightCostUsd) * 0.05),
        otherChargesUsd: 450,
        targetRevenueUsd: data.targetRevenueUsd,
        currency: 'USD',
      },
      status: 'Preparing',
      carrierOrForwarder: data.carrierOrForwarder || 'HarborLink Logistics',
      eta: 'In 18 days',
      etd: 'In 4 days',
      owner: 'Aarav',
      assignedTo: 'Aarav Mehta',
      milestones: defaultMilestones,
      documents: defaultDocs,
      createdAt: nowStr,
      updatedAt: 'Just now',
    };

    this.shipments = [newShipment, ...this.shipments];
    this.saveShipments();

    this.logActivity({
      shipmentId: newId,
      type: 'booking',
      title: `Shipment ${newId} initiated`,
      detail: `New trade order created for ${data.cargoDescription} to ${data.destCity} (${data.destCountry}).`,
    });

    this.notify();
    return newShipment;
  }

  public updateShipmentStatus(id: string, status: ShipmentStatus, note?: string) {
    const shipment = this.shipments.find((s) => s.id === id);
    if (!shipment) return;

    shipment.status = status;
    shipment.updatedAt = 'Just now';
    if (note) shipment.exceptionNote = note;

    // Advance milestone if applicable
    if (status === 'Booked') {
      const m1 = shipment.milestones.find((m) => m.title.includes('Booking'));
      if (m1) m1.status = 'completed';
    } else if (status === 'In Transit') {
      shipment.milestones.forEach((m) => {
        if (m.title.includes('Booking') || m.title.includes('Cargo') || m.title.includes('Export') || m.title.includes('departed')) {
          m.status = 'completed';
        }
        if (m.title.includes('In transit')) {
          m.status = 'in_progress';
        }
      });
    } else if (status === 'Delivered') {
      shipment.milestones.forEach((m) => (m.status = 'completed'));
    }

    this.saveShipments();
    this.logActivity({
      shipmentId: id,
      type: status === 'Exception' ? 'exception' : 'movement',
      title: `Status updated for ${id}: ${status}`,
      detail: note || `Shipment operational state transitioned to ${status}.`,
    });
    this.notify();
  }

  public updateDocumentStatus(
    shipmentId: string,
    docId: string,
    newStatus: DocumentStatus,
    verifiedBy?: string
  ) {
    const shipment = this.shipments.find((s) => s.id === shipmentId);
    if (!shipment) return;

    const doc = shipment.documents.find((d) => d.id === docId);
    if (!doc) return;

    doc.status = newStatus;
    doc.updatedAt = 'Just now';
    if (verifiedBy) doc.verifiedBy = verifiedBy;

    this.saveShipments();
    this.logActivity({
      shipmentId,
      type: 'documentation',
      title: `${doc.name} updated for ${shipmentId}`,
      detail: `Document status changed to ${newStatus}${verifiedBy ? ` by ${verifiedBy}` : ''}.`,
    });
    this.notify();
  }

  public generateDraftDocument(
    shipmentId: string,
    docType: DocumentType
  ): TradeDocument | undefined {
    const shipment = this.shipments.find((s) => s.id === shipmentId);
    if (!shipment) return;

    let doc = shipment.documents.find((d) => d.name === docType);
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    if (doc) {
      doc.status = 'Draft';
      doc.fileName = `${docType.replace(/\s+/g, '_')}_${shipment.id}.pdf`;
      doc.updatedAt = nowStr;
    } else {
      doc = {
        id: `doc-${Date.now()}`,
        shipmentId,
        name: docType,
        fileName: `${docType.replace(/\s+/g, '_')}_${shipment.id}.pdf`,
        status: 'Draft',
        updatedAt: nowStr,
        requiredFor: 'Customs Clearance',
        referenceNumber: `DFT-${Date.now().toString().slice(-6)}`,
      };
      shipment.documents.push(doc);
    }

    this.saveShipments();
    this.logActivity({
      shipmentId,
      type: 'documentation',
      title: `Draft generated: ${docType}`,
      detail: `Automated draft generated for shipment ${shipmentId} based on cargo & invoice parameters.`,
    });
    this.notify();
    return doc;
  }

  public logActivity(event: {
    shipmentId?: string;
    type: ActivityEvent['type'];
    title: string;
    detail: string;
    actor?: string;
  }) {
    const newAct: ActivityEvent = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeDisplay: 'Just now',
      shipmentId: event.shipmentId,
      type: event.type,
      actor: event.actor || DEMO_COMPANY.currentUser.name,
      title: event.title,
      detail: event.detail,
    };
    this.activities = [newAct, ...this.activities];
    this.saveActivities();
    this.notify();
  }

  public resetDemoData() {
    this.shipments = INITIAL_SHIPMENTS;
    this.activities = INITIAL_ACTIVITIES;
    this.saveShipments();
    this.saveActivities();
    this.notify();
  }
}

export const tradeService = new TradeService();
