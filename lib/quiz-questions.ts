import type { BuyerPersona, QuizAnswers } from "@/types/persona";

export interface AnswerOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface QuizQuestion {
  id: keyof QuizAnswers;
  headline: string;
  contextNote?: string;
  multi?: boolean;
  options: AnswerOption[];
  isConditional?: boolean;
  showWhen?: (answers: QuizAnswers) => boolean;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    headline: "Let's start simple — who's mostly going to be in this car?",
    contextNote: "This shapes seating, boot space, and safety priorities.",
    options: [
      { value: "SOLO", label: "Just me", sublabel: "Mostly solo drives" },
      { value: "COUPLE", label: "Me and a partner", sublabel: "Occasional trips together" },
      { value: "FAMILY", label: "Family with kids", sublabel: "Practicality matters" },
      { value: "LARGE_FAMILY", label: "Large family", sublabel: "I often drive a group" },
    ],
  },
  {
    id: "q2",
    headline: "What will this car spend most of its life doing?",
    contextNote: "City driving favours efficient, nimble cars. Highway use shifts the priority to comfort and long-range efficiency.",
    options: [
      { value: "CITY_COMMUTE", label: "Daily office commute in the city" },
      { value: "FAMILY_TRIPS", label: "Weekend family trips and occasional daily use" },
      { value: "MIXED", label: "Mix of city driving and highway runs" },
      { value: "HIGHWAY", label: "Mostly highway — I cover serious distances" },
    ],
  },
  {
    id: "q3",
    headline: "What's the number where you'd start feeling uncomfortable? (On-road, all-in)",
    contextNote: "We ask for your on-road comfort ceiling, not ex-showroom, to avoid surprises when insurance and RTO are added.",
    options: [
      { value: "under_8", label: "Under ₹8 lakh" },
      { value: "8_to_15", label: "₹8 – 15 lakh" },
      { value: "15_to_25", label: "₹15 – 25 lakh" },
      { value: "25_to_40", label: "₹25 – 40 lakh" },
      { value: "above_40", label: "Above ₹40 lakh" },
    ],
  },
  {
    id: "q4",
    headline: "Some buyers want the highest crash rating available. Others are happy with a solid, reliable car. Where do you stand?",
    contextNote: "Rather than listing airbag counts, this filters to NCAP-rated cars when safety is flagged as critical.",
    options: [
      { value: "true", label: "Safety is non-negotiable", sublabel: "Only show me cars with strong ratings" },
      { value: "moderate", label: "I'd like good safety", sublabel: "But I'm open to trade-offs" },
      { value: "false", label: "Not a primary concern right now" },
    ],
  },
  {
    id: "q5",
    headline: "Last one — any of these matter to you? Pick as many as you like, or skip.",
    contextNote: "These act as soft boosters in the ranking — a car that ticks 3 of these ranks above one that ticks 0.",
    multi: true,
    options: [
      { value: "good_mileage", label: "Great mileage / low running cost" },
      { value: "large_boot", label: "Spacious boot (I travel with a lot of luggage)" },
      { value: "premium", label: "Premium feel inside the cabin" },
      { value: "easy_park", label: "Easy to park and manoeuvre in tight spaces" },
      { value: "good_resale", label: "Good resale value" },
      { value: "fun", label: "I want something fun to drive" },
    ],
  },
  // ── Conditional follow-ups ──
  {
    id: "cq_kids_age",
    headline: "How old are the kids?",
    contextNote: "Young children change what matters in a car — child locks, rear legroom, and boot space all shift in priority.",
    isConditional: true,
    showWhen: (a) => a.q1 === "FAMILY" || a.q1 === "LARGE_FAMILY",
    options: [
      { value: "toddler", label: "Toddlers / young kids" },
      { value: "school_age", label: "School-age" },
      { value: "grown_up", label: "Mostly grown up" },
    ],
  },
  {
    id: "cq_parking",
    headline: "Do you have a parking spot at home, or is street parking your reality?",
    isConditional: true,
    showWhen: (a) => a.q2 === "CITY_COMMUTE",
    options: [
      { value: "false", label: "I have a dedicated spot" },
      { value: "true", label: "Street parking or tight lanes are my daily reality" },
    ],
  },
  {
    id: "cq_road_trips",
    headline: "Any long road trips, or is it more of a straight-line daily highway run?",
    isConditional: true,
    showWhen: (a) => a.q2 === "HIGHWAY",
    options: [
      { value: "false", label: "Mostly a straight daily highway commute" },
      { value: "true", label: "Long road trips too — weekend getaways, interstate drives" },
    ],
  },
];

export const CORE_QUESTION_IDS: Array<keyof QuizAnswers> = ["q1", "q2", "q3", "q4", "q5"];

export function getActiveQuestions(answers: QuizAnswers): QuizQuestion[] {
  const core = QUIZ_QUESTIONS.filter((q) => !q.isConditional);
  const conditionals = QUIZ_QUESTIONS.filter(
    (q) => q.isConditional && q.showWhen?.(answers)
  );
  return [...core, ...conditionals];
}

export function detectContradiction(answers: QuizAnswers): import("@/types/persona").Contradiction | null {
  const isLargeFamily = answers.q1 === "LARGE_FAMILY" || answers.q1 === "FAMILY";
  const isTightBudget = answers.q3 === "under_8";
  const isSafetyCritical = answers.q4 === "true";
  const isHighwayDriver = answers.q2 === "HIGHWAY";
  const wantsEasyParking = (answers.q5 as string[] | undefined)?.includes("easy_park");

  if (isLargeFamily && isTightBudget) {
    return {
      id: "family_tight_budget",
      message: "Honest heads up — a large family and a sub-₹8L budget is a tough combination. 5-seaters exist in this range but rear space is snug.",
      suggestion: "Want to see what's possible as-is, or stretch the budget slightly to ₹10L?",
    };
  }

  if (isSafetyCritical && isTightBudget) {
    return {
      id: "safety_tight_budget",
      message: "At this budget, strong NCAP-rated cars are limited. I'll show the safest available, but wanted you to know upfront.",
    };
  }

  if (isHighwayDriver && wantsEasyParking) {
    return {
      id: "highway_parking",
      message: "You'll be doing mostly highway driving — parking agility matters less there. Should I still factor it in, or focus on highway comfort?",
    };
  }

  return null;
}

export function buildPersonaFromAnswers(answers: QuizAnswers): Partial<BuyerPersona> {
  const BUDGET_MAP: Record<string, { min: number; max: number }> = {
    under_8:  { min: 0, max: 800000 },
    "8_to_15": { min: 800000, max: 1500000 },
    "15_to_25": { min: 1500000, max: 2500000 },
    "25_to_40": { min: 2500000, max: 4000000 },
    above_40: { min: 4000000, max: 99999999 },
  };

  const USE_KM_MAP: Record<string, number> = {
    CITY_COMMUTE: 12000, FAMILY_TRIPS: 15000, MIXED: 18000, HIGHWAY: 25000,
  };

  const budget = answers.q3 ? BUDGET_MAP[answers.q3 as string] : { min: 0, max: 1500000 };
  return {
    familySize: answers.q1 as BuyerPersona["familySize"],
    primaryUse: answers.q2 as BuyerPersona["primaryUse"],
    budgetMin: budget?.min ?? 0,
    budgetMax: budget?.max ?? 1500000,
    annualKm: USE_KM_MAP[answers.q2 as string] ?? 15000,
    safetyPriority: answers.q4 === "true",
    softPreferences: (answers.q5 as string[]) ?? [],
    fuelPreference: "NONE" as BuyerPersona["fuelPreference"],
    conditionals: {
      kidsAge: answers.cq_kids_age,
      parkingTight: answers.cq_parking === "true" || answers.cq_parking === true,
      roadTrips: answers.cq_road_trips === "true" || answers.cq_road_trips === true,
    },
  };
}
