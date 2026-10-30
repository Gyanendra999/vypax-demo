import { LandedCostCalculation } from '../types/trade';
import { apiClient } from './apiClient';

export interface CalculatorInput {
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
}

export function calculateLandedCost(input: CalculatorInput): LandedCostCalculation {
  const qty = Math.max(0, input.quantity);
  const unitPrice = Math.max(0, input.unitPrice);
  const productValue = Math.round(qty * unitPrice * 100) / 100;

  const freight = Math.max(0, input.freightCost);
  const insurance = Math.max(0, input.insuranceCost);
  const otherCharges = Math.max(0, input.otherPortCharges);

  // CIF Value basis for customs valuation (Cost + Insurance + Freight)
  const cifValue = Math.round((productValue + freight + insurance) * 100) / 100;

  // Basic Customs Duty (BCD) on CIF value
  const dutyRate = Math.max(0, input.dutyRatePercent) / 100;
  const dutyAmount = Math.round(cifValue * dutyRate * 100) / 100;

  // Additional cess / surcharge if applicable (calculated on duty)
  const cessRate = Math.max(0, input.customsCessPercent) / 100;
  const cessAmount = Math.round(dutyAmount * cessRate * 100) / 100;

  const totalDutyAndTaxes = Math.round((dutyAmount + cessAmount) * 100) / 100;

  // Total Landed Cost
  const totalLandedCost = Math.round((productValue + freight + insurance + totalDutyAndTaxes + otherCharges) * 100) / 100;

  // Per Unit Cost
  const costPerUnit = qty > 0 ? Math.round((totalLandedCost / qty) * 100) / 100 : 0;

  // Expected Revenue & Margin
  const expectedRevenue = Math.round(qty * Math.max(0, input.targetSellingPricePerUnit) * 100) / 100;
  const estimatedGrossMarginUsd = Math.round((expectedRevenue - totalLandedCost) * 100) / 100;
  const estimatedGrossMarginPercent = expectedRevenue > 0
    ? Math.round(((estimatedGrossMarginUsd / expectedRevenue) * 100) * 100) / 100
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

export async function calculateLandedCostBackend(input: CalculatorInput): Promise<LandedCostCalculation> {
  try {
    return await apiClient.post<LandedCostCalculation>('/calculator/calculate', input);
  } catch {
    return calculateLandedCost(input);
  }
}

export async function saveCalculationBackend(calc: LandedCostCalculation): Promise<any> {
  try {
    return await apiClient.post('/calculator/save', calc);
  } catch (err) {
    console.warn('[Calculator] Failed to persist calculation to backend:', err);
    return calc;
  }
}

export const CALCULATION_PRESETS: CalculatorInput[] = [
  {
    productName: 'Industrial Precision Components',
    hsCode: '8483.40',
    quantity: 500,
    unitPrice: 42,
    currency: 'USD',
    origin: 'Nhava Sheva (IN)',
    destination: 'Jebel Ali, Dubai (AE)',
    freightCost: 1250,
    insuranceCost: 180,
    dutyRatePercent: 5.0,
    customsCessPercent: 0,
    otherPortCharges: 350,
    targetSellingPricePerUnit: 64,
  },
  {
    productName: 'Textile Machinery Subassemblies',
    hsCode: '8448.32',
    quantity: 120,
    unitPrice: 280,
    currency: 'USD',
    origin: 'Mumbai (IN)',
    destination: 'Hamburg Port (DE)',
    freightCost: 3100,
    insuranceCost: 450,
    dutyRatePercent: 4.2,
    customsCessPercent: 0,
    otherPortCharges: 620,
    targetSellingPricePerUnit: 395,
  },
  {
    productName: 'Cast Aluminum Auto Components',
    hsCode: '8708.29',
    quantity: 1500,
    unitPrice: 18.5,
    currency: 'USD',
    origin: 'Chennai Port (IN)',
    destination: 'Port of Newark, NY (US)',
    freightCost: 4800,
    insuranceCost: 320,
    dutyRatePercent: 2.5,
    customsCessPercent: 0,
    otherPortCharges: 850,
    targetSellingPricePerUnit: 28.0,
  },
];
