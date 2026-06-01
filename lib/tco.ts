import Decimal from "decimal.js";
import type { TCOInput, TCOResult, YearlySnapshot } from "@/types/tco";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

function pmt(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper;
  const r = new Decimal(rate);
  const n = new Decimal(nper);
  const p = new Decimal(pv);
  const factor = r.times(r.plus(1).pow(n)).div(r.plus(1).pow(n).minus(1));
  return factor.times(p).toNumber();
}

export function calculateTCO(
  input: TCOInput,
  ownershipCost: {
    serviceCostPerVisit: number | null;
    serviceIntervalKm: number | null;
    tyreReplacementCost: number | null;
    depreciationYear1: Decimal | null;
    depreciationAnnual: Decimal | null;
    insuranceIdvEstimate: number | null;
  } | null
): TCOResult {
  const {
    onRoadPrice, downPayment, loanTenureMonths, interestRatePercent,
    annualKm, ownershipYears, fuelPricePerLitre, electricityTariffPerKwh,
    mileageKmpl, rangeKm, isElectric,
  } = input;

  const loanAmount = onRoadPrice - downPayment;
  const monthlyRate = interestRatePercent / 12 / 100;
  const monthlyEmi = loanAmount > 0 ? pmt(monthlyRate, loanTenureMonths, loanAmount) : 0;
  const totalLoan = monthlyEmi * loanTenureMonths;

  const annualFuelCost = isElectric
    ? rangeKm && rangeKm > 0
      ? (annualKm / rangeKm) * electricityTariffPerKwh // spec: annualKm / rangeKm × tariff
      : 0
    : mileageKmpl && mileageKmpl > 0
      ? (annualKm / mileageKmpl) * fuelPricePerLitre
      : 0;

  // Insurance: IDV-based, ~2.5% of current IDV per year
  const idv = ownershipCost?.insuranceIdvEstimate ?? onRoadPrice * 0.85;
  const depY1 = ownershipCost?.depreciationYear1 ? Number(ownershipCost.depreciationYear1) : 0.15;
  const depAnn = ownershipCost?.depreciationAnnual ? Number(ownershipCost.depreciationAnnual) : 0.10;

  const serviceCostPerVisit = ownershipCost?.serviceCostPerVisit ?? 6000;
  const serviceIntervalKm = ownershipCost?.serviceIntervalKm ?? 10000;
  const tyreReplacementCost = ownershipCost?.tyreReplacementCost ?? 20000;
  const tyreDurabilityKm = 60000;

  const yearlySnapshots: YearlySnapshot[] = [];
  let cumulativeCost = downPayment;
  let currentIdv = idv * (1 - depY1);
  let resaleValue = 0;

  let totalFuel = 0, totalInsurance = 0, totalService = 0, totalTyres = 0;

  for (let year = 1; year <= ownershipYears; year++) {
    const emiPaid = year <= Math.ceil(loanTenureMonths / 12)
      ? Math.min(monthlyEmi * 12, monthlyEmi * (loanTenureMonths - (year - 1) * 12))
      : 0;

    const fuelPaid = Math.round(annualFuelCost);
    const insurance = year === 1 ? 0 : Math.round(currentIdv * 0.025); // yr1 included in on-road
    const servicesPerYear = Math.floor(annualKm / serviceIntervalKm);
    const servicePaid = servicesPerYear * serviceCostPerVisit;
    const tyreKmThisYear = annualKm;
    const tyrePaid = Math.round((tyreKmThisYear / tyreDurabilityKm) * tyreReplacementCost);

    if (year > 1) currentIdv = currentIdv * (1 - depAnn);
    resaleValue = Math.max(0, currentIdv);

    cumulativeCost += emiPaid + fuelPaid + insurance + servicePaid + tyrePaid;
    totalFuel += fuelPaid;
    totalInsurance += insurance;
    totalService += servicePaid;
    totalTyres += tyrePaid;

    yearlySnapshots.push({
      year,
      emiPaid: Math.round(emiPaid),
      fuelPaid,
      insurancePaid: insurance,
      servicePaid,
      tyrePaid,
      resaleValue: Math.round(resaleValue),
      cumulativeCost: Math.round(cumulativeCost),
      netCost: Math.round(cumulativeCost - resaleValue),
    });
  }

  const totalSpend = Math.round(cumulativeCost);
  const netAfterResale = Math.round(cumulativeCost - resaleValue);
  const avgMonthlyCost = Math.round(netAfterResale / (ownershipYears * 12));

  return {
    totalSpend,
    resaleValue: Math.round(resaleValue),
    netAfterResale,
    avgMonthlyCost,
    monthlyEmi: Math.round(monthlyEmi),
    breakdown: {
      loan: Math.round(totalLoan),
      fuel: totalFuel,
      insurance: totalInsurance,
      service: totalService,
      tyres: totalTyres,
    },
    yearByYear: yearlySnapshots,
  };
}

export interface TCOScenarioNudge {
  id: string;
  message: string;
}

export function getScenarioNudges(input: TCOInput, fuelType: string): TCOScenarioNudge[] {
  const nudges: TCOScenarioNudge[] = [];

  if (fuelType === "DIESEL" && input.annualKm < 20000) {
    nudges.push({
      id: "diesel_low_km",
      message: `At ${input.annualKm.toLocaleString("en-IN")} km/year, a diesel engine won't save you money — the fuel efficiency advantage doesn't offset the higher purchase and service costs until ~20,000 km/year.`,
    });
  }

  if (input.loanTenureMonths > 60) {
    nudges.push({
      id: "long_tenure",
      message: "A loan longer than 5 years means you'll be paying for the car longer than it holds its best resale value. Consider a shorter tenure or a higher down payment.",
    });
  }

  if (input.downPayment / input.onRoadPrice < 0.10) {
    nudges.push({
      id: "low_down_payment",
      message: "A very low down payment increases your total interest significantly. Even a small increase in the upfront amount can save you thousands over the loan period.",
    });
  }

  return nudges;
}
