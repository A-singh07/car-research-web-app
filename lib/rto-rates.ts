// RTO registration charges as a percentage of ex-showroom price
// Source: approximate state RTO rates (includes registration + road tax)
export const RTO_RATES: Record<string, number> = {
  Delhi:          0.04,
  Maharashtra:    0.11,
  Karnataka:      0.13,
  "Tamil Nadu":   0.10,
  Telangana:      0.09,
  Gujarat:        0.06,
  "West Bengal":  0.07,
  Rajasthan:      0.06,
  "Uttar Pradesh": 0.08,
  Punjab:         0.06,
};

export const INSURANCE_RATE = 0.035;        // ~3.5% of ex-showroom for year 1
export const ACCESSORIES_ESTIMATE = 15000;  // INR — avg accessories on delivery

export function estimateOnRoadPrice(exShowroom: number, state: string): number {
  const rtoRate = RTO_RATES[state] ?? 0.08;
  const rto = Math.round(exShowroom * rtoRate);
  const insurance = Math.round(exShowroom * INSURANCE_RATE);
  return exShowroom + rto + insurance + ACCESSORIES_ESTIMATE;
}
