import crypto from 'crypto';
import { db } from '../db/database';
import { LandedCostCalculation } from '../../src/types/trade';
import { CalculatorInput } from '../../src/services/calculatorService';

// Exchange rates relative to USD (Authoritative base rates)
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  AED: 3.6725,
  INR: 83.95,
  GBP: 0.79,
  SGD: 1.34,
  JPY: 151.2,
};

export class CalculatorService {
  // Authoritative decimal-safe calculation
  public calculate(input: CalculatorInput): LandedCostCalculation {
    const qty = Math.max(0, Number(input.quantity) || 0);
    const unitPrice = Math.max(0, Number(input.unitPrice) || 0);
    const productValue = Math.round(qty * unitPrice * 100) / 100;

    const freight = Math.max(0, Number(input.freightCost) || 0);
    const insurance = Math.max(0, Number(input.insuranceCost) || 0);
    const otherCharges = Math.max(0, Number(input.otherPortCharges) || 0);

    // CIF Value = Product Value + Freight + Insurance
    const cifValue = Math.round((productValue + freight + insurance) * 100) / 100;

    // Basic Customs Duty (BCD) on CIF value
    const dutyRate = Math.max(0, Number(input.dutyRatePercent) || 0) / 100;
    const dutyAmount = Math.round(cifValue * dutyRate * 100) / 100;

    // Cess / surcharge on duty
    const cessRate = Math.max(0, Number(input.customsCessPercent) || 0) / 100;
    const cessAmount = Math.round(dutyAmount * cessRate * 100) / 100;

    const totalDutyAndTaxes = Math.round((dutyAmount + cessAmount) * 100) / 100;

    // Total Landed Cost
    const totalLandedCost =
      Math.round((productValue + freight + insurance + totalDutyAndTaxes + otherCharges) * 100) / 100;

    // Unit Cost
    const costPerUnit = qty > 0 ? Math.round((totalLandedCost / qty) * 100) / 100 : 0;

    // Expected Revenue & Margins
    const targetPrice = Math.max(0, Number(input.targetSellingPricePerUnit) || 0);
    const expectedRevenue = Math.round(qty * targetPrice * 100) / 100;
    const estimatedGrossMarginUsd = Math.round((expectedRevenue - totalLandedCost) * 100) / 100;
    const estimatedGrossMarginPercent =
      expectedRevenue > 0
        ? Math.round((estimatedGrossMarginUsd / expectedRevenue) * 10000) / 100
        : 0;

    return {
      ...input,
      productValue,
      dutyAmount,
      cessAmount,
      totalDutyAndTaxes,
      totalLandedCost,
      costPerUnit,
      expectedRevenue,
      estimatedGrossMarginUsd,
      estimatedGrossMarginPercent,
    };
  }

  // Convert calculation to target currency
  public convertCurrency(
    calculation: LandedCostCalculation,
    targetCurrency: string
  ): LandedCostCalculation & { convertedCurrency: string; exchangeRate: number } {
    const fromRate = EXCHANGE_RATES[calculation.currency] || 1.0;
    const toRate = EXCHANGE_RATES[targetCurrency] || 1.0;
    const multiplier = toRate / fromRate;

    const round = (val: number) => Math.round(val * multiplier * 100) / 100;

    return {
      ...calculation,
      convertedCurrency: targetCurrency,
      exchangeRate: multiplier,
      unitPrice: round(calculation.unitPrice),
      productValue: round(calculation.productValue),
      freightCost: round(calculation.freightCost),
      insuranceCost: round(calculation.insuranceCost),
      otherPortCharges: round(calculation.otherPortCharges),
      dutyAmount: round(calculation.dutyAmount),
      cessAmount: round(calculation.cessAmount),
      totalDutyAndTaxes: round(calculation.totalDutyAndTaxes),
      totalLandedCost: round(calculation.totalLandedCost),
      costPerUnit: round(calculation.costPerUnit),
      expectedRevenue: round(calculation.expectedRevenue),
      estimatedGrossMarginUsd: round(calculation.estimatedGrossMarginUsd),
      targetSellingPricePerUnit: round(calculation.targetSellingPricePerUnit),
    };
  }

  // Save calculation to workspace history
  public saveCalculation(
    workspaceId: string,
    calculation: LandedCostCalculation
  ): LandedCostCalculation & { id: string; workspaceId: string; createdAt: string } {
    const id = `calc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const record = {
      ...calculation,
      id,
      workspaceId,
      createdAt: new Date().toISOString(),
    };
    db.calculations.set(id, record);
    return record;
  }

  // Get workspace calculation history
  public getHistory(workspaceId: string): (LandedCostCalculation & { id: string; createdAt: string })[] {
    return Array.from(db.calculations.values())
      .filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const backendCalculatorService = new CalculatorService();
