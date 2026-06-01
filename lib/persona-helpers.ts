"use client";

// Shared persona utilities used by Feature 3 (Comparison) and Feature 5 (TCO).
// Features 3 and 5 ONLY import from this file — never from store/persona.ts directly.
// This decouples them from the quiz store's internal shape.

import { usePersonaStore } from "@/store/persona";
import type { BuyerPersona } from "@/types/persona";
import type { BuyerProfile } from "@/app/generated/prisma/client";

export const DEFAULT_PERSONA: BuyerPersona = {
  primaryUse: "CITY_COMMUTE",
  familySize: "COUPLE",
  budgetMin: 0,
  budgetMax: 1500000,
  annualKm: 15000,
  fuelPreference: "NONE",
  safetyPriority: false,
  softPreferences: [],
  conditionals: {},
};

// Hook: returns persona from quiz store, or DEFAULT_PERSONA if quiz not completed.
// Features 3 and 5 call this — they do NOT call usePersonaStore() directly.
export function useActivePersona(): { persona: BuyerPersona; hasQuizPersona: boolean } {
  const store = usePersonaStore();
  const hasQuizPersona = store.isComplete && store.primaryUse !== null;

  if (!hasQuizPersona) return { persona: DEFAULT_PERSONA, hasQuizPersona: false };

  const persona: BuyerPersona = {
    primaryUse: store.primaryUse,
    familySize: store.familySize,
    budgetMin: store.budgetMin,
    budgetMax: store.budgetMax,
    annualKm: store.annualKm,
    fuelPreference: store.fuelPreference,
    safetyPriority: store.safetyPriority,
    softPreferences: store.softPreferences,
    conditionals: store.conditionals,
  };

  return { persona, hasQuizPersona: true };
}

// Converts a DB BuyerProfile row into a BuyerPersona.
// Used by Feature 3's shared comparison page (server-fetched profile → client-side verdicts).
export function personaFromBuyerProfile(profile: BuyerProfile): BuyerPersona {
  return {
    primaryUse: profile.primaryUse,
    familySize: profile.familySize,
    budgetMin: profile.budgetMin,
    budgetMax: profile.budgetMax,
    annualKm: profile.annualKm,
    fuelPreference: profile.fuelPreference,
    safetyPriority: profile.safetyPriority,
    softPreferences: Array.isArray(profile.softPreferences) ? profile.softPreferences as string[] : [],
    conditionals: {},
  };
}

// Returns the persona summary one-liner shown in persona banners.
// Used by Feature 2 (shortlist page), Feature 3 (comparison), and Feature 5 (TCO pre-fill banner).
export function formatPersonaSummary(persona: BuyerPersona): string {
  const USE_LABELS: Record<string, string> = {
    CITY_COMMUTE: "city commute",
    FAMILY_TRIPS: "weekend family trips",
    HIGHWAY: "highway driving",
    MIXED: "mixed city and highway use",
  };
  const FAMILY_LABELS: Record<string, string> = {
    SOLO: "solo",
    COUPLE: "couple",
    FAMILY: "family",
    LARGE_FAMILY: "large family",
  };
  const BUDGET_LABEL =
    persona.budgetMax >= 99000000
      ? "above ₹40L"
      : `up to ₹${(persona.budgetMax / 100000).toFixed(0)}L`;

  const use = USE_LABELS[persona.primaryUse ?? "CITY_COMMUTE"] ?? "daily use";
  const family = FAMILY_LABELS[persona.familySize ?? "COUPLE"] ?? "";
  const safety = persona.safetyPriority ? " · Safety priority" : "";

  return `${family ? `${family[0].toUpperCase()}${family.slice(1)} · ` : ""}${use[0].toUpperCase()}${use.slice(1)} · Budget ${BUDGET_LABEL}${safety}`;
}

// Returns whether a given set of variant IDs can form a valid comparison.
// Used by Feature 3's compare page to decide whether to show the comparison UI or a "add cars" prompt.
export function isValidComparison(carIds: string[]): boolean {
  return carIds.length >= 2 && carIds.length <= 4;
}
