import type { VariantWithModel } from "@/types/car";
import type { BuyerPersona } from "@/types/persona";

function makeName(v: VariantWithModel) {
  return `${v.model.make.name} ${v.model.name}`;
}

function fmt(n: number) {
  return `₹${(n / 100000).toFixed(1)}L`;
}

export function pricingSectionVerdict(variants: VariantWithModel[], persona: BuyerPersona): string {
  if (variants.length < 2) return "";
  const sorted = [...variants].sort(
    (a, b) => (a.priceOnroadEstimate ?? a.priceExshowroom) - (b.priceOnroadEstimate ?? b.priceExshowroom)
  );
  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];
  const gap = (mostExpensive.priceOnroadEstimate ?? mostExpensive.priceExshowroom) -
              (cheapest.priceOnroadEstimate ?? cheapest.priceExshowroom);

  if (gap < 30000) return "These cars are very close on price — the difference is negligible.";

  const budgetNote = persona.budgetMax <= 1200000 ? " For a budget-conscious buyer, that gap matters." : "";
  return `${makeName(cheapest)} is ${fmt(gap)} cheaper on-road.${budgetNote}`;
}

export function safetySectionVerdict(variants: VariantWithModel[], persona: BuyerPersona): string {
  if (variants.length < 2) return "";
  const withRating = variants.filter((v) => v.ncapRating != null);
  if (withRating.length === 0) return "None of these cars have a published NCAP rating yet.";

  const best = [...withRating].sort((a, b) => (b.ncapRating ?? 0) - (a.ncapRating ?? 0))[0];
  const rating = best.ncapRating ?? 0;

  if (persona.safetyPriority && rating >= 5) {
    return `${makeName(best)} is the only 5-star rated car here. If safety is your top priority, this is the clear winner.`;
  }
  if (persona.safetyPriority && rating >= 4) {
    return `${makeName(best)} leads on safety with a ${rating}-star NCAP rating — important given you flagged safety as a priority.`;
  }
  return `${makeName(best)} has the strongest crash rating at ${rating} stars.`;
}

export function efficiencySectionVerdict(variants: VariantWithModel[], persona: BuyerPersona): string {
  if (variants.length < 2) return "";
  const iceCars = variants.filter((v) => v.mileageKmpl != null);
  if (iceCars.length === 0) return "All these cars are EVs — compare range and charging costs instead.";

  const sorted = [...iceCars].sort((a, b) => Number(b.mileageKmpl) - Number(a.mileageKmpl));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const annualKm = persona.annualKm;
  const fuelPrice = 95; // approximate

  const bestMileage = Number(best.mileageKmpl);
  const worstMileage = Number(worst.mileageKmpl);
  if (Math.abs(bestMileage - worstMileage) < 1.5) {
    return "These cars are very similar in fuel efficiency — real-world difference will be marginal.";
  }

  const annualSaving = Math.round(annualKm * (1 / worstMileage - 1 / bestMileage) * fuelPrice);
  const fiveYrSaving = annualSaving * 5;
  return `${makeName(best)} saves roughly ₹${annualSaving.toLocaleString("en-IN")}/year in fuel on your commute. Over 5 years that's ₹${(fiveYrSaving / 100000).toFixed(1)}L.`;
}

export function spaceSectionVerdict(variants: VariantWithModel[], persona: BuyerPersona): string {
  if (variants.length < 2) return "";
  const sorted = [...variants].sort((a, b) => (b.bootSpaceLitres ?? 0) - (a.bootSpaceLitres ?? 0));
  const biggest = sorted[0];
  const boot = biggest.bootSpaceLitres ?? 0;
  const isFamily = persona.familySize === "FAMILY" || persona.familySize === "LARGE_FAMILY";

  if (isFamily && boot > 400) {
    return `${makeName(biggest)} has noticeably more boot space (${boot}L) — fits your family's luggage comfortably.`;
  }
  if (isFamily) {
    return `Boot space is modest across the board — worth testing with your pram or luggage before deciding.`;
  }
  return `${makeName(biggest)} offers the most boot space at ${boot}L.`;
}

export function ownershipSectionVerdict(variants: VariantWithModel[]): string {
  const wide = variants.find((v) => v.model.make.serviceNetworkTier === "WIDE");
  if (wide) {
    return `${wide.model.make.name}'s service network is among the most extensive in India — useful if you travel to smaller cities.`;
  }
  return "Service availability varies by city — check your nearest authorised service centre before buying.";
}

export function performanceSectionVerdict(variants: VariantWithModel[], persona: BuyerPersona): string {
  if (variants.length < 2) return "";
  const sorted = [...variants].sort((a, b) => (b.powerBhp ?? 0) - (a.powerBhp ?? 0));
  const most = sorted[0];
  const least = sorted[sorted.length - 1];
  const diff = (most.powerBhp ?? 0) - (least.powerBhp ?? 0);

  if (diff < 15) {
    return "Both cars feel similar in city traffic — the power difference won't be noticeable day to day.";
  }
  if (persona.primaryUse === "HIGHWAY" || persona.softPreferences.includes("fun")) {
    return `${makeName(most)}'s ${most.powerBhp} bhp gives it a clear edge for highway overtakes and spirited driving.`;
  }
  return `${makeName(most)} has more power, though the difference mainly shows on highways, not city driving.`;
}

export function overallVerdict(variants: VariantWithModel[], persona: BuyerPersona): {
  winnerId: string | null;
  winnerName: string | null;
  text: string;
} {
  if (variants.length < 2) return { winnerId: null, winnerName: null, text: "" };

  type Scored = { v: VariantWithModel; score: number };
  const scores: Scored[] = variants.map((v) => {
    let s = 0;
    const onRoad = v.priceOnroadEstimate ?? v.priceExshowroom * 1.15;
    if (onRoad <= persona.budgetMax) s += 10;
    if (persona.safetyPriority && (v.ncapRating ?? 0) >= 4) s += 20;
    if (persona.safetyPriority && (v.ncapRating ?? 0) >= 5) s += 10;
    if (persona.primaryUse === "CITY_COMMUTE" && Number(v.mileageKmpl ?? 0) > 18) s += 10;
    if (persona.primaryUse === "HIGHWAY" && (v.powerBhp ?? 0) > 100) s += 8;
    if ((persona.familySize === "FAMILY" || persona.familySize === "LARGE_FAMILY") && (v.bootSpaceLitres ?? 0) > 350) s += 8;
    if (persona.conditionals.parkingTight && Number(v.turningRadiusM ?? 99) < 5.2) s += 8;
    persona.softPreferences.forEach((p) => {
      const features = (v.featuresList as string[]) ?? [];
      if (p === "good_mileage" && Number(v.mileageKmpl ?? 0) > 18) s += 6;
      if (p === "premium" && features.some((f) => ["sunroof", "premium_audio"].includes(f))) s += 6;
      if (p === "fun" && (v.powerBhp ?? 0) > 120) s += 6;
    });
    return { v, score: s };
  });

  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];
  const runnerUp = scores[1];
  const gap = winner.score - runnerUp.score;

  if (gap <= 5) {
    const winName = makeName(winner.v);
    const runName = makeName(runnerUp.v);
    return {
      winnerId: null,
      winnerName: null,
      text: `These two are genuinely close for your use case. Choose the ${winName} if ${persona.safetyPriority ? "safety ratings" : "running cost"} is the priority. Choose the ${runName} if you want ${persona.softPreferences.includes("premium") ? "a more premium cabin" : "better value"}.`,
    };
  }

  const w = winner.v;
  const highlights: string[] = [];
  if (persona.safetyPriority && (w.ncapRating ?? 0) >= 4) highlights.push(`${w.ncapRating}-star safety rating`);
  if ((persona.familySize === "FAMILY" || persona.familySize === "LARGE_FAMILY") && (w.bootSpaceLitres ?? 0) > 300) highlights.push(`${w.bootSpaceLitres}L boot for your family`);
  const onRoad = w.priceOnroadEstimate ?? Math.round(w.priceExshowroom * 1.15);
  if (onRoad <= persona.budgetMax) highlights.push(`within your ₹${(persona.budgetMax / 100000).toFixed(0)}L budget`);

  return {
    winnerId: w.id,
    winnerName: makeName(w),
    text: `Best pick is the ${w.model.make.name} ${w.model.name} ${w.name}. ${highlights.join(", ") || "Best overall match for your profile"}.`,
  };
}
