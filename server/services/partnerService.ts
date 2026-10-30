import { db } from '../db/database';
import { TradeOpportunity, LogisticsPartner } from '../../src/types/trade';

export class OpportunityService {
  public listOpportunities(
    workspaceId: string,
    filters?: { category?: string; search?: string }
  ): TradeOpportunity[] {
    let list = Array.from(db.opportunities.values());

    if (filters?.category && filters.category !== 'All') {
      list = list.filter((o) => o.category === filters.category);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.origin.toLowerCase().includes(q) ||
          o.destination.toLowerCase().includes(q) ||
          o.hsCode.toLowerCase().includes(q)
      );
    }

    return list;
  }

  public getOpportunityById(id: string): TradeOpportunity | null {
    return db.opportunities.get(id) || null;
  }

  public toggleSaveOpportunity(id: string): TradeOpportunity {
    const opp = db.opportunities.get(id);
    if (!opp) throw new Error('Opportunity not found.');

    const updated = {
      ...opp,
      isSaved: !(opp as any).isSaved,
    };
    db.opportunities.set(id, updated);
    return updated;
  }
}

export const opportunityService = new OpportunityService();

export class PartnerService {
  public listPartners(
    workspaceId: string,
    filters?: { type?: string; search?: string }
  ): LogisticsPartner[] {
    let list = Array.from(db.partners.values()).filter((p) => p.workspaceId === workspaceId);

    if (filters?.type && filters.type !== 'All') {
      list = list.filter((p) => p.type === filters.type);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.coverage.toLowerCase().includes(q) ||
          p.contactPerson.toLowerCase().includes(q)
      );
    }

    return list;
  }

  public createPartner(
    workspaceId: string,
    data: Omit<LogisticsPartner, 'id' | 'activeShipmentCount'>
  ): LogisticsPartner {
    const id = `partner-${Date.now()}`;
    const newPartner: LogisticsPartner & { workspaceId: string } = {
      ...data,
      id,
      workspaceId,
      activeShipmentCount: 0,
    };
    db.partners.set(id, newPartner);
    return newPartner;
  }

  public updatePartner(
    workspaceId: string,
    partnerId: string,
    updates: Partial<LogisticsPartner>
  ): LogisticsPartner {
    const partner = db.partners.get(partnerId);
    if (!partner || partner.workspaceId !== workspaceId) {
      throw new Error('Partner not found.');
    }

    const updated = {
      ...partner,
      ...updates,
    };
    db.partners.set(partnerId, updated);
    return updated;
  }
}

export const partnerService = new PartnerService();
