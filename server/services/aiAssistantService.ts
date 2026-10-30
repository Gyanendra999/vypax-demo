import { GoogleGenAI } from '@google/genai';
import { db } from '../db/database';

export class AIAssistantService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        console.warn('[AIAssistant] Could not initialize GoogleGenAI client:', err);
      }
    }
  }

  public async getTradeAdvice(params: {
    workspaceId: string;
    query: string;
    shipmentId?: string;
  }): Promise<{ reply: string; groundedContext?: string }> {
    // 1. Gather workspace context
    const shipments = Array.from(db.shipments.values()).filter((s) => s.workspaceId === params.workspaceId);
    const exceptions = shipments.filter((s) => s.status === 'Exception');
    const docs = Array.from(db.documents.values()).filter((d) => d.workspaceId === params.workspaceId);
    const missingDocs = docs.filter((d) => d.status === 'Missing');

    let specificShipmentText = '';
    if (params.shipmentId) {
      const target = shipments.find((s) => s.id.toLowerCase() === params.shipmentId?.toLowerCase());
      if (target) {
        specificShipmentText = `Selected Shipment Context:
ID: ${target.id} (${target.title})
Origin: ${target.origin.port}, ${target.origin.city} -> Destination: ${target.destination.port}, ${target.destination.city}
Cargo: ${target.cargo.description} (HS Code: ${target.cargo.hsCode}, Container: ${target.cargo.containerType}, Qty: ${target.cargo.quantity} ${target.cargo.unit})
Status: ${target.status}, Carrier: ${target.carrierOrForwarder}, ETA: ${target.eta}
Declared Value: $${target.financials.declaredValueUsd}, Freight: $${target.financials.freightCostUsd}
`;
      }
    }

    const systemInstruction = `You are the Vyaapx Trade Assistant, an enterprise-grade international trade operations expert and logistics copilot.
Your job is to provide accurate, concise, grounded trade guidance covering:
1. Export/import documentation (Commercial Invoices, Packing Lists, Bills of Lading, Shipping Bills, Certificates of Origin).
2. Incoterms 2020 definitions and obligations (FOB, CIF, CFR, EXW, DAP, DDP).
3. Landed cost formulas (Product Value + Freight + Insurance = CIF valuation, followed by Basic Customs Duties, Cess, and handling charges).
4. Operational exception handling (vessel rollovers, port congestion, customs queries).
5. HS Code classification best practices.

Active Operational Workspace Status:
- Total shipments: ${shipments.length}
- In transit: ${shipments.filter((s) => s.status === 'In Transit').length}
- Current exceptions: ${exceptions.length} (${exceptions.map((e) => `${e.id}: ${e.exceptionNote || 'Hold'}`).join('; ') || 'None'})
- Missing documents needing action: ${missingDocs.length} (${missingDocs.slice(0, 3).map((d) => `${d.name} for ${d.shipmentId}`).join(', ')})
${specificShipmentText}

Guidelines:
- Keep answers professional, practical, and operations-focused.
- Highlight specific documents or Incoterm responsibilities where applicable.
- Always conclude with actionable next steps for the trade operations desk.
- Never output disclaimers in the main body (the UI appends standard regulatory disclaimers).`;

    // 2. Call Gemini API if client initialized
    if (this.ai) {
      try {
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
        const responsePromise = this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: params.query,
          config: {
            systemInstruction,
          },
        });

        const response = await Promise.race([responsePromise, timeoutPromise]);

        if (response && (response as any).text) {
          const replyText = (response as any).text;
          if (replyText && replyText.trim()) {
            return {
              reply: replyText.trim(),
              groundedContext: `${shipments.length} shipments tracked in workspace`,
            };
          }
        }
      } catch (err: any) {
        console.warn('[AIAssistant] Gemini API call error:', err?.message || err);
      }
    }

    // 3. High-quality grounded fallback trade knowledge when offline or key not provided
    const lower = params.query.toLowerCase();
    let reply = '';

    if (lower.includes('document') || lower.includes('ready to book') || lower.includes('booking')) {
      reply =
        'For export booking readiness, the workspace standardly tracks: (1) Commercial Invoice stating unit prices, terms, and buyer/seller identities, (2) Packing List specifying net/gross weights and pallet counts, and (3) Draft Shipping Bill for customs declaration. Depending on the destination and Incoterm, a Certificate of Origin (e.g. CEPA for UAE or EUR-1 for Europe) or Fumigation Certificate may also be mandatory. Requirements vary by jurisdiction—always verify with your licensed Customs Broker.';
    } else if (lower.includes('incoterm') || lower.includes('fob') || lower.includes('cif')) {
      reply =
        "FOB (Free On Board) obligates the seller to deliver goods past the ship's rail at the named port of loading. From that moment, the buyer assumes all marine freight, transit insurance, import duties, and discharge risk. In contrast, CIF (Cost, Insurance, and Freight) requires the seller to procure and pay for ocean freight and baseline marine insurance up to the destination port, though risk of loss transfers to the buyer once goods are on board.";
    } else if (lower.includes('cost') || lower.includes('landed') || lower.includes('margin') || lower.includes('calculate')) {
      reply =
        'In Vyaapx, Estimated Landed Cost is computed as: Product Value (Qty × Unit Price) + Ocean Freight + Transit Cargo Insurance + Destination Customs Duty & Cess + Destination Handling/Port Charges. Under standard WTO valuation rules, ad valorem duty rates apply to the CIF valuation basis. You can run automated multi-currency simulations in the Trade Calculator.';
    } else if (lower.includes('hs code') || lower.includes('tariff') || lower.includes('classification')) {
      reply =
        'Harmonized System (HS) codes are 6-to-10 digit standardized numerical classifications developed by the World Customs Organization. The first 6 digits are harmonized globally (e.g., 8483.40 for gears and gearing), while national customs administrations add trailing subheadings (e.g., 8483.40.00) to determine exact import duties, anti-dumping levies, and regulatory import prohibitions.';
    } else if (lower.includes('exception') || lower.includes('delay') || lower.includes('congestion')) {
      reply =
        'When a shipment is marked "Exception" (such as port congestion or feeder rollover), the operational protocol is: (1) Request revised booking allocation and feeder cut-off from the carrier agent, (2) Update container gate-in validity and CFS ground rent windows, (3) Revalidate export shipping bill validity dates with Customs EDI, and (4) Notify the consignee with a revised ETA.';
    } else {
      reply = `Regarding "${params.query}": In international trade execution, operations depend on destination customs regulations, product HS classification, and the agreed Incoterms 2020 rule. Your active workspace currently tracks ${shipments.length} operational consignments. Verify the required documentation in the Documents module or simulate margins in the Trade Calculator.`;
    }

    return {
      reply,
      groundedContext: `${shipments.length} active shipments in workspace`,
    };
  }
}

export const aiAssistantService = new AIAssistantService();
