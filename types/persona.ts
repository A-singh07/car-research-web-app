import type { PrimaryUse, FamilySize, FuelPreference } from "@/app/generated/prisma/enums";

export type { PrimaryUse, FamilySize, FuelPreference };

export interface BuyerPersona {
  primaryUse: PrimaryUse | null;
  familySize: FamilySize | null;
  budgetMin: number;
  budgetMax: number;
  annualKm: number;
  fuelPreference: FuelPreference;
  safetyPriority: boolean;
  softPreferences: string[];
  conditionals: {
    kidsAge?: "toddler" | "school_age" | "grown_up";
    parkingTight?: boolean;
    roadTrips?: boolean;
  };
}

// Raw answers hold the option `value` strings emitted by the quiz UI
// (e.g. q3 = "under_8", q4 = "true"). They are mapped to persona fields by
// the store (incrementally, for F3/F5) and by buildPersonaFromAnswers (on submit).
export interface QuizAnswers {
  q1?: FamilySize;
  q2?: PrimaryUse;
  q3?: string;
  q4?: string;
  q5?: string[];
  cq_kids_age?: "toddler" | "school_age" | "grown_up";
  cq_parking?: string;
  cq_road_trips?: string;
}

export interface Contradiction {
  id: string;
  message: string;
  suggestion?: string;
}
