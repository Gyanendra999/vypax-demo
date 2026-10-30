import { db } from '../db/database';
import { Shipment, ShipmentStatus, Milestone, TradeDocument } from '../../src/types/trade';
import { activityService } from './activityService';
import { notificationService } from './notificationService';

export class ShipmentService {
  // List shipments with filtering and search
  public listShipments(
    workspaceId: string,
    filters?: {
      search?: string;
      status?: string;
      origin?: string;
      destination?: string;
    }
  ): Shipment[] {
    let list = Array.from(db.shipments.values()).filter(
      (s) => s.workspaceId === workspaceId && !s.isArchived
    );

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.cargo.description.toLowerCase().includes(q) ||
          s.carrierOrForwarder.toLowerCase().includes(q) ||
          s.destination.city.toLowerCase().includes(q)
      );
    }

    if (filters?.status && filters.status !== 'All') {
      list = list.filter((s) => s.status === filters.status);
    }

    // Attach current documents
    return list.map((s) => ({
      ...s,
      documents: Array.from(db.documents.values()).filter(
        (d) => d.shipmentId === s.id && d.workspaceId === workspaceId
      ),
    }));
  }

  // Get shipment by ID
  public getShipmentById(workspaceId: string, id: string): Shipment | null {
    const s = Array.from(db.shipments.values()).find(
      (item) =>
        item.workspaceId === workspaceId &&
        item.id.toLowerCase() === id.toLowerCase() &&
        !item.isArchived
    );

    if (!s) return null;

    const docs = Array.from(db.documents.values()).filter(
      (d) => d.shipmentId === s.id && d.workspaceId === workspaceId
    );

    return {
      ...s,
      documents: docs,
    };
  }

  // Create new shipment
  public createShipment(
    workspaceId: string,
    actorName: string,
    data: {
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
    }
  ): Shipment {
    const count = Array.from(db.shipments.values()).filter((s) => s.workspaceId === workspaceId).length;
    const nextNum = 24020 + count + 1;
    const newId = `VPX-${nextNum}`;
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    const defaultMilestones: Milestone[] = [
      {
        id: 'm1',
        title: 'Booking confirmed',
        description: 'Shipment created and awaiting booking placement',
        status: 'in_progress',
        timestamp: `${nowStr} 10:00`,
        location: 'Export Operations Desk',
      },
      {
        id: 'm2',
        title: 'Cargo received at CFS',
        description: 'Factory staging and transport dispatch',
        status: 'pending',
      },
      {
        id: 'm3',
        title: 'Export documentation verified',
        description: 'Invoice, packing list and shipping bill filing',
        status: 'pending',
      },
      {
        id: 'm4',
        title: 'Vessel departed',
        description: 'Port terminal loading and departure',
        status: 'pending',
      },
      {
        id: 'm5',
        title: 'In transit',
        description: 'Vessel transit tracking',
        status: 'pending',
      },
      {
        id: 'm6',
        title: 'Port arrival',
        description: 'Destination port discharge',
        status: 'pending',
      },
      {
        id: 'm7',
        title: 'Final delivery',
        description: 'Destination customs clearance & consignee receipt',
        status: 'pending',
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
        referenceNumber: `INV/EXP/26/${nextNum}`,
      },
      {
        id: `doc-${Date.now()}-2`,
        shipmentId: newId,
        name: 'Packing List',
        status: 'Draft',
        updatedAt: nowStr,
        requiredFor: 'Customs Clearance',
        referenceNumber: `PKL/26/${nextNum}`,
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

    const newShipment: Shipment & { workspaceId: string } = {
      id: newId,
      workspaceId,
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
      owner: actorName,
      assignedTo: actorName,
      milestones: defaultMilestones,
      documents: defaultDocs,
      createdAt: nowStr,
      updatedAt: 'Just now',
    };

    db.shipments.set(newId, newShipment);

    defaultDocs.forEach((doc) => {
      db.documents.set(doc.id, {
        ...doc,
        workspaceId,
      });
    });

    activityService.logActivity({
      workspaceId,
      shipmentId: newId,
      type: 'booking',
      title: `Shipment ${newId} initiated`,
      detail: `New trade order created for ${data.cargoDescription} to ${data.destCity} (${data.destCountry}).`,
      actor: actorName,
    });

    notificationService.createNotification({
      workspaceId,
      type: 'shipment',
      title: `New Shipment Initialized: ${newId}`,
      message: `${data.cargoDescription} to ${data.destCity} created by ${actorName}.`,
      link: `/shipments/${newId}`,
    });

    return newShipment;
  }

  // Update shipment status
  public updateShipmentStatus(
    workspaceId: string,
    id: string,
    status: ShipmentStatus,
    note?: string,
    actorName = 'Operations Manager'
  ): Shipment {
    const shipment = this.getShipmentById(workspaceId, id);
    if (!shipment) throw new Error(`Shipment ${id} not found.`);

    shipment.status = status;
    shipment.updatedAt = 'Just now';
    if (note) shipment.exceptionNote = note;

    // Advance milestones
    if (status === 'Booked') {
      const m1 = shipment.milestones.find((m) => m.title.includes('Booking'));
      if (m1) m1.status = 'completed';
    } else if (status === 'In Transit') {
      shipment.milestones.forEach((m) => {
        if (
          m.title.includes('Booking') ||
          m.title.includes('Cargo') ||
          m.title.includes('Export') ||
          m.title.includes('departed')
        ) {
          m.status = 'completed';
        }
        if (m.title.includes('In transit')) {
          m.status = 'in_progress';
        }
      });
    } else if (status === 'Delivered') {
      shipment.milestones.forEach((m) => (m.status = 'completed'));
    }

    db.shipments.set(id, { ...shipment, workspaceId });

    activityService.logActivity({
      workspaceId,
      shipmentId: id,
      type: status === 'Exception' ? 'exception' : 'movement',
      title: `Status updated for ${id}: ${status}`,
      detail: note || `Shipment operational state transitioned to ${status}.`,
      actor: actorName,
    });

    notificationService.createNotification({
      workspaceId,
      type: status === 'Exception' ? 'exception' : 'shipment',
      title: `Shipment ${id} Status: ${status}`,
      message: note || `Operational progress updated to ${status}.`,
      link: `/shipments/${id}`,
    });

    return shipment;
  }
}

export const shipmentService = new ShipmentService();
