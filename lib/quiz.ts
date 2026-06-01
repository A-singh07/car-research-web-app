"use server";

import { prisma } from "@/lib/prisma";
import type { BuyerPersona } from "@/types/persona";
import type { MatchedCar } from "@/types/car";
import type { QuizAnswers } from "@/types/persona";

export async function createQuizSession(userId: string | null) {
  return prisma.quizSession.create({
    data: {
      userId: userId ?? undefined,
      answers: {},
      status: "IN_PROGRESS",
    },
  });
}

export async function updateQuizSession(
  sessionId: string,
  answers: QuizAnswers,
  profileId: string
) {
  return prisma.quizSession.update({
    where: { id: sessionId },
    data: {
      answers: answers as object,
      profileId,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

export async function saveBuyerProfile(userId: string, persona: BuyerPersona) {
  return prisma.buyerProfile.create({
    data: {
      userId,
      primaryUse: persona.primaryUse ?? "MIXED",
      familySize: persona.familySize ?? "SOLO",
      budgetMin: persona.budgetMin,
      budgetMax: persona.budgetMax,
      annualKm: persona.annualKm,
      fuelPreference: persona.fuelPreference,
      safetyPriority: persona.safetyPriority,
      softPreferences: persona.softPreferences,
    },
  });
}

export async function saveShortlistResults(sessionId: string, results: MatchedCar[]) {
  await prisma.shortlistResult.deleteMany({ where: { sessionId } });
  return prisma.shortlistResult.createMany({
    data: results.map((r) => ({
      sessionId,
      variantId: r.variant.id,
      matchScore: r.matchScore,
      matchReason: r.matchReason,
      rank: r.rank,
    })),
  });
}

export async function getShortlistForSession(sessionId: string) {
  const results = await prisma.shortlistResult.findMany({
    where: { sessionId },
    orderBy: { rank: "asc" },
    include: {
      variant: {
        include: { model: { include: { make: true } }, ownershipCost: true },
      },
    },
  });
  return results.map((r) => ({
    variant: r.variant,
    matchScore: r.matchScore,
    matchReason: r.matchReason,
    rank: r.rank,
  }));
}

export async function getSessionWithProfile(sessionId: string) {
  return prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { buyerProfile: true },
  });
}

// Single entry-point called by quiz/page.tsx on final submission.
// Orchestrates: save profile → create session → score shortlist → persist results.
export async function submitQuiz(
  userId: string,
  persona: BuyerPersona,
  rawAnswers: QuizAnswers
): Promise<{ sessionId: string; profileId: string }> {
  const { getShortlistForPersona } = await import("@/lib/cars");

  const profile = await saveBuyerProfile(userId, persona);
  const session = await createQuizSession(userId);
  await updateQuizSession(session.id, rawAnswers, profile.id);
  const scored = await getShortlistForPersona(persona);
  await saveShortlistResults(session.id, scored);

  return { sessionId: session.id, profileId: profile.id };
}
