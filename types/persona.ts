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

export interface QuizAnswers {
  q1?: FamilySize;
  q2?: PrimaryUse;
  q3?: { min: number; max: number };
  q4?: boolean;
  q5?: string[];
  cq_kids_age?: "toddler" | "school_age" | "grown_up";
  cq_parking?: boolean;
  cq_road_trips?: boolean;
}

export interface Contradiction {
  id: string;
  message: string;
  suggestion?: string;
}
