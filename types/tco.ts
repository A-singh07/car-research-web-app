export interface TCOInput {
  onRoadPrice: number;
  downPayment: number;
  loanTenureMonths: number;
  interestRatePercent: number;
  annualKm: number;
  ownershipYears: number;
  fuelPricePerLitre: number;
  electricityTariffPerKwh: number;
  mileageKmpl: number | null;
  rangeKm: number | null;
  isElectric: boolean;
}

export interface YearlySnapshot {
  year: number;
  emiPaid: number;
  fuelPaid: number;
  insurancePaid: number;
  servicePaid: number;
  tyrePaid: number;
  resaleValue: number;
  cumulativeCost: number;
  netCost: number;
}

export interface TCOBreakdown {
  loan: number;
  fuel: number;
  insurance: number;
  service: number;
  tyres: number;
}

export interface TCOResult {
  totalSpend: number;
  resaleValue: number;
  netAfterResale: number;
  avgMonthlyCost: number;
  monthlyEmi: number;
  breakdown: TCOBreakdown;
  yearByYear: YearlySnapshot[];
}
