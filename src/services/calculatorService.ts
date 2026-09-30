import { LandedCostCalculation } from '../types/trade';

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
  const productValue = qty * unitPrice;
  
  const freight = Math.max(0, input.freightCost);
  const insurance = Math.max(0, input.insuranceCost);
  const otherCharges = Math.max(0, input.otherPortCharges);

  // CIF Value basis for customs valuation (Cost + Insurance + Freight)
  const cifValue = productValue + freight + insurance;
  
  // Basic Customs Duty (BCD) on CIF value
  const dutyRate = Math.max(0, input.dutyRatePercent) / 100;
  const dutyAmount = cifValue * dutyRate;

  // Additional cess / surcharge if applicable (calculated on duty)
  const cessRate = Math.max(0, input.customsCessPercent) / 100;
  const cessAmount = dutyAmount * cessRate;

  const totalDutyAndTaxes = dutyAmount + cessAmount;

  // Total Landed Cost
  const totalLandedCost = productValue + freight + insurance + totalDutyAndTaxes + otherCharges;

  // Per Unit Cost
  const costPerUnit = qty > 0 ? totalLandedCost / qty : 0;

  // Expected Revenue & Margin
  const expectedRevenue = qty * Math.max(0, input.targetSellingPricePerUnit);
  const estimatedGrossMarginUsd = expectedRevenue - totalLandedCost;
  const estimatedGrossMarginPercent = expectedRevenue > 0
    ? (estimatedGrossMarginUsd / expectedRevenue) * 100
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
