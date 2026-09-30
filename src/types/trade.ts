export type ShipmentStatus =
  | 'Draft'
  | 'Preparing'
  | 'Documentation'
  | 'Ready to Book'
  | 'Booked'
  | 'In Transit'
  | 'At Port'
  | 'Delivered'
  | 'Exception';

export type DocumentStatus =
  | 'Missing'
  | 'Draft'
  | 'Under Review'
  | 'Verified';

export type DocumentType =
  | 'Commercial Invoice'
  | 'Packing List'
  | 'Shipping Bill'
  | 'Certificate of Origin'
  | 'Bill of Lading'
  | 'Dangerous Goods Declaration'
  | 'Letter of Credit';

export interface TradeDocument {
  id: string;
  shipmentId: string;
  name: DocumentType;
  fileName?: string;
  status: DocumentStatus;
  updatedAt: string;
  requiredFor: 'Booking' | 'Customs Clearance' | 'Vessel Loading' | 'Delivery';
  verifiedBy?: string;
  notes?: string;
  referenceNumber?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  timestamp?: string;
  location?: string;
}

export interface Shipment {
  id: string; // e.g. VPX-24017
  title: string;
  origin: {
    city: string;
    country: string;
    port: string;
    code: string;
  };
  destination: {
    city: string;
    country: string;
    port: string;
    code: string;
  };
  cargo: {
    description: string;
    category: string;
    hsCode: string;
    quantity: number;
    unit: string;
    grossWeightKg: number;
    volumeCbm: number;
    containerType: '20FT Standard' | '40FT High Cube' | 'LCL Consolidation' | 'Air Cargo';
    packageCount: number;
  };
  financials: {
    declaredValueUsd: number;
    freightCostUsd: number;
    insuranceCostUsd: number;
    estimatedDutyUsd: number;
    otherChargesUsd: number;
    targetRevenueUsd: number;
    currency: string;
  };
  status: ShipmentStatus;
  carrierOrForwarder: string;
  vesselName?: string;
  voyageNumber?: string;
  bookingReference?: string;
  eta: string;
  etd: string;
  owner: string;
  assignedTo: string;
  milestones: Milestone[];
  documents: TradeDocument[];
  exceptionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeOpportunity {
  id: string;
  title: string;
  category: string;
  origin: string;
  destination: string;
  hsCode: string;
  indicativeMarginMin: number;
  indicativeMarginMax: number;
  demandLevel: 'High' | 'Medium' | 'Steady';
  avgFreightEstimate: number;
  typicalTariffRate: string;
  overview: string;
  keyRequirements: string[];
}

export interface LogisticsPartner {
  id: string;
  name: string;
  type: 'Freight Forwarder' | 'Transporter' | 'Warehouse' | 'CFS' | 'Customs / Documentation';
  coverage: string;
  status: 'Active' | 'Under Review' | 'Onboarded';
  rating: string;
  contactPerson: string;
  contactEmail: string;
  notes: string;
  activeShipmentCount: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  timeDisplay: string;
  shipmentId?: string;
  type: 'documentation' | 'booking' | 'movement' | 'exception' | 'system';
  actor: string;
  title: string;
  detail: string;
}

export interface LandedCostCalculation {
  productName: string;
  hsCode: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  origin: string;
  destination: string;
  freightCost: number;
  insuranceCost: number;
  dutyRatePercent: number;
  customsCessPercent: number;
  otherPortCharges: number;
  targetSellingPricePerUnit: number;

  // Calculated values
  productValue: number;
  dutyAmount: number;
  cessAmount: number;
  totalDutyAndTaxes: number;
  totalLandedCost: number;
  costPerUnit: number;
  expectedRevenue: number;
  estimatedGrossMarginUsd: number;
  estimatedGrossMarginPercent: number;
}
