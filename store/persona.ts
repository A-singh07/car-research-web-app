"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BuyerPersona, QuizAnswers } from "@/types/persona";
import type { PrimaryUse, FamilySize, FuelPreference } from "@/app/generated/prisma/enums";

const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  "under_8": { min: 0, max: 800000 },
  "8_to_15": { min: 800000, max: 1500000 },
  "15_to_25": { min: 1500000, max: 2500000 },
  "25_to_40": { min: 2500000, max: 4000000 },
  "above_40": { min: 4000000, max: 99999999 },
};

const USE_TO_ANNUAL_KM: Record<PrimaryUse, number> = {
  CITY_COMMUTE: 12000,
  FAMILY_TRIPS: 15000,
  MIXED: 18000,
  HIGHWAY: 25000,
};

interface PersonaState extends BuyerPersona {
  quizSessionId: string | null;
  profileId: string | null;
  rawAnswers: QuizAnswers;
  isComplete: boolean;
  setAnswer: (key: keyof QuizAnswers, value: QuizAnswers[keyof QuizAnswers]) => void;
  setSessionId: (id: string) => void;
  setProfileId: (id: string) => void;
  markComplete: () => void;
  reset: () => void;
}

const DEFAULT_PERSONA: BuyerPersona = {
  primaryUse: null,
  familySize: null,
  budgetMin: 0,
  budgetMax: 1500000,
  annualKm: 15000,
  fuelPreference: "NONE" as FuelPreference,
  safetyPriority: false,
  softPreferences: [],
  conditionals: {},
};

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PERSONA,
      quizSessionId: null,
      profileId: null,
      rawAnswers: {},
      isComplete: false,

      setAnswer: (key, value) => {
        const prev = get();
        const rawAnswers = { ...prev.rawAnswers, [key]: value };
        const updates: Partial<BuyerPersona> = {};

        if (key === "q1") updates.familySize = value as FamilySize;
        if (key === "q2") {
          const use = value as PrimaryUse;
          updates.primaryUse = use;
          updates.annualKm = USE_TO_ANNUAL_KM[use] ?? 15000;
        }
        if (key === "q3") {
          const budget = BUDGET_RANGES[value as string] ?? { min: 0, max: 1500000 };
          updates.budgetMin = budget.min;
          updates.budgetMax = budget.max;
        }
        if (key === "q4") updates.safetyPriority = value === "true";
        if (key === "q5") updates.softPreferences = value as string[];
        if (key === "cq_kids_age") updates.conditionals = { ...prev.conditionals, kidsAge: value as BuyerPersona["conditionals"]["kidsAge"] };
        if (key === "cq_parking") updates.conditionals = { ...prev.conditionals, parkingTight: value === "true" };
        if (key === "cq_road_trips") updates.conditionals = { ...prev.conditionals, roadTrips: value === "true" };

        set({ rawAnswers, ...updates });
      },

      setSessionId: (id) => set({ quizSessionId: id }),
      setProfileId: (id) => set({ profileId: id }),
      markComplete: () => set({ isComplete: true }),

      reset: () => set({
        ...DEFAULT_PERSONA,
        quizSessionId: null,
        profileId: null,
        rawAnswers: {},
        isComplete: false,
      }),
    }),
    { name: "car-research-persona" }
  )
);

export { BUDGET_RANGES };
