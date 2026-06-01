export const FUEL_PRICES: Record<string, { petrol: number; diesel: number; cng: number }> = {
  Delhi:     { petrol: 94.72,  diesel: 87.62,  cng: 74.09 },
  Mumbai:    { petrol: 104.21, diesel: 92.15,  cng: 66.00 },
  Bangalore: { petrol: 102.86, diesel: 88.94,  cng: 80.00 },
  Chennai:   { petrol: 100.85, diesel: 92.44,  cng: 72.00 },
  Hyderabad: { petrol: 107.41, diesel: 95.65,  cng: 77.00 },
  Pune:      { petrol: 104.95, diesel: 91.12,  cng: 68.00 },
  Kolkata:   { petrol: 105.01, diesel: 92.76,  cng: 73.00 },
  Ahmedabad: { petrol: 96.63,  diesel: 92.38,  cng: 69.00 },
};

export const ELECTRICITY_TARIFF_HOME = 8;      // ₹/kWh — home charging
export const ELECTRICITY_TARIFF_PUBLIC = 16;   // ₹/kWh — public fast charge blended

export const FUEL_PRICES_LAST_UPDATED = "2026-06-01";

export function getFuelPrice(city: string, fuelType: "PETROL" | "DIESEL" | "CNG"): number {
  const prices = FUEL_PRICES[city] ?? FUEL_PRICES["Delhi"];
  return fuelType === "PETROL" ? prices.petrol : fuelType === "DIESEL" ? prices.diesel : prices.cng;
}
