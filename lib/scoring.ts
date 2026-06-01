/* eslint-disable @typescript-eslint/no-unused-vars */
import type { VariantWithModel, MatchedCar } from "@/types/car";
import type { BuyerPersona } from "@/types/persona";

const PREFERRED_FUEL: Record<string, string[]> = {
  CITY_COMMUTE: ["PETROL", "ELECTRIC", "CNG"],
  FAMILY_TRIPS: ["PETROL", "DIESEL", "HYBRID"],
  MIXED:        ["PETROL", "DIESEL", "HYBRID"],
  HIGHWAY:      ["DIESEL", "PETROL", "HYBRID"],
};

function getFeatures(v: VariantWithModel): string[] {
  const f = v.featuresList;
  if (!f || !Array.isArray(f)) return [];
  return f as string[];
}

function getTags(v: VariantWithModel): string[] {
  const t = v.useCaseTags;
  if (!t || !Array.isArray(t)) return [];
  return t as string[];
}

export function scoreVariant(variant: VariantWithModel, persona: BuyerPersona): number {
  const onRoad = variant.priceOnroadEstimate ?? variant.priceExshowroom * 1.15;
  const ncap = variant.ncapRating ?? 0;
  const mileage = Number(variant.mileageKmpl ?? 0);
  const boot = variant.bootSpaceLitres ?? 0;
  const turning = Number(variant.turningRadiusM ?? 99);

  // ── Hard eliminations ─────────────────────────
  if (onRoad > persona.budgetMax) return 0;
  if (persona.familySize === "LARGE_FAMILY" && (variant.seatingCapacity ?? 5) < 7) return 0;
  if (persona.safetyPriority && ncap > 0 && ncap < 4) return 0;

  let score = 50; // base

  // ── Budget fit (+0 to +20) ─────────────────────
  const gap = Math.max(0, persona.budgetMax - onRoad);
  const utilisation = 1 - gap / persona.budgetMax;
  score += Math.round(utilisation * 20);

  // ── Safety bonus (+0 to +20) ───────────────────
  if (ncap > 0) {
    score += persona.safetyPriority ? ncap * 4 : ncap * 2;
  }

  // ── Use-case tag match (+5 each, up to +20) ────
  const personaTags = inferPersonaTags(persona);
  const variantTags = getTags(variant);
  const tagMatches = variantTags.filter((t) => personaTags.includes(t)).length;
  score += Math.min(tagMatches * 5, 20);

  // ── Q5 soft preferences (+8 each) ─────────────
  const prefs = persona.softPreferences ?? [];
  if (prefs.includes("good_mileage") && mileage > 18) score += 8;
  if (prefs.includes("large_boot") && boot > 350) score += 8;
  if (prefs.includes("easy_park") && turning < 5.2) score += 8;
  if (prefs.includes("premium") && getFeatures(variant).some((f) => ["sunroof", "premium_audio", "panoramic_sunroof"].includes(f))) score += 8;
  if (prefs.includes("good_resale") && ["Maruti Suzuki", "Hyundai", "Toyota"].includes(variant.model.make.name)) score += 8;
  if (prefs.includes("fun") && (variant.powerBhp ?? 0) > 120) score += 8;

  // ── Fuel type alignment (+10 if preferred) ─────
  const preferred = PREFERRED_FUEL[persona.primaryUse ?? "CITY_COMMUTE"] ?? [];
  if (preferred[0] === variant.fuelType) score += 10;
  else if (preferred.includes(variant.fuelType)) score += 5;

  // ── Conditional boosts ─────────────────────────
  const features = getFeatures(variant);
  if (persona.conditionals.kidsAge === "toddler") {
    if (features.includes("5_star_ncap") || ncap >= 5) score += 5;
  }
  if (persona.conditionals.parkingTight && turning < 5.0) score += 8;
  if (persona.conditionals.roadTrips && boot > 400) score += 5;

  return Math.min(99, Math.max(1, score));
}

function inferPersonaTags(persona: BuyerPersona): string[] {
  const tags: string[] = [];
  if (persona.primaryUse === "CITY_COMMUTE") tags.push("city");
  if (persona.primaryUse === "HIGHWAY") tags.push("highway");
  if (persona.primaryUse === "FAMILY_TRIPS") tags.push("family");
  if (persona.primaryUse === "MIXED") tags.push("city", "highway");
  if (persona.familySize === "FAMILY" || persona.familySize === "LARGE_FAMILY") tags.push("family");
  if (persona.familySize === "LARGE_FAMILY") tags.push("large_family");
  if (persona.safetyPriority) tags.push("safe");
  if (persona.budgetMax <= 1000000) tags.push("budget");
  if (persona.softPreferences.includes("fun")) tags.push("fun");
  if (persona.softPreferences.includes("premium")) tags.push("premium");
  if (persona.softPreferences.includes("good_mileage")) tags.push("good_mileage");
  return tags;
}

export function scoreVariants(variants: VariantWithModel[], persona: BuyerPersona): MatchedCar[] {
  return variants
    .map((v) => {
      const score = scoreVariant(v, persona);
      return score > 0
        ? { variant: v, matchScore: score, matchReason: generateMatchReason(v, persona, score), rank: 0 }
        : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export function generateMatchReason(variant: VariantWithModel, persona: BuyerPersona, score: number): string {
  const make = variant.model.make.name;
  const model = variant.model.name;
  const ncap = variant.ncapRating;
  const mileage = Number(variant.mileageKmpl ?? 0);
  const boot = variant.bootSpaceLitres ?? 0;
  const features = getFeatures(variant);
  const hasADAS = features.includes("adas");
  const hasSunroof = features.includes("sunroof") || features.includes("panoramic_sunroof");
  const isEV = variant.fuelType === "ELECTRIC";

  const parts: string[] = [];

  if (persona.safetyPriority && ncap && ncap >= 4) {
    parts.push(`${ncap}-star NCAP rating`);
  }
  if (persona.primaryUse === "CITY_COMMUTE" && mileage > 18) {
    parts.push(`${mileage} km/l city mileage`);
  }
  if (persona.primaryUse === "HIGHWAY") {
    parts.push(`comfortable at highway speeds`);
  }
  if ((persona.familySize === "FAMILY" || persona.familySize === "LARGE_FAMILY") && boot > 300) {
    parts.push(`${boot}L boot`);
  }
  if (persona.conditionals.parkingTight && Number(variant.turningRadiusM ?? 99) < 5.2) {
    parts.push(`easy to park (${variant.turningRadiusM}m turning radius)`);
  }
  if (persona.softPreferences.includes("premium") && hasSunroof) {
    parts.push(`sunroof and premium interior`);
  }
  if (isEV) {
    parts.push(`zero fuel cost with ${variant.rangeKm} km range`);
  }
  if (persona.softPreferences.includes("fun") && (variant.powerBhp ?? 0) > 120) {
    parts.push(`${variant.powerBhp} bhp for spirited driving`);
  }

  if (parts.length === 0) {
    const onRoad = variant.priceOnroadEstimate ?? Math.round(variant.priceExshowroom * 1.15);
    parts.push(`fits your ₹${(onRoad / 100000).toFixed(1)}L budget`);
    if (ncap) parts.push(`${ncap}-star safety`);
  }

  return `${make} ${model} — ${parts.slice(0, 3).join(", ")}.`;
}
