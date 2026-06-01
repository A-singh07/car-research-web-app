/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { usePersonaStore } from "@/store/persona";
import { useSessionStore } from "@/store/session";
import { getActiveQuestions, detectContradiction } from "@/lib/quiz-questions";
import { submitQuiz } from "@/lib/quiz";
import { getOrCreateAnonymousUser } from "@/lib/users";
import { QuizStep } from "@/components/quiz/QuizStep";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { ContradictionNudge } from "@/components/quiz/ContradictionNudge";
import { Button } from "@/components/ui/Button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import type { Contradiction, BuyerPersona, QuizAnswers } from "@/types/persona";

export default function QuizPage() {
  const router = useRouter();
  const personaStore = usePersonaStore();
  const userId = useSessionStore((s) => s.userId);
  const setUserId = useSessionStore((s) => s.setUserId);

  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contradiction, setContradiction] = useState<Contradiction | null>(null);

  useEffect(() => setMounted(true), []);

  const activeQuestions = getActiveQuestions(personaStore.rawAnswers);
  const currentStep = activeQuestions[stepIndex];

  async function ensureSession(): Promise<string> {
    if (userId) return userId;
    const user = await getOrCreateAnonymousUser(crypto.randomUUID());
    setUserId(user.id);
    return user.id;
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const id = await ensureSession();
      const persona: BuyerPersona = {
        primaryUse: personaStore.primaryUse,
        familySize: personaStore.familySize,
        budgetMin: personaStore.budgetMin,
        budgetMax: personaStore.budgetMax,
        annualKm: personaStore.annualKm,
        fuelPreference: personaStore.fuelPreference,
        safetyPriority: personaStore.safetyPriority,
        softPreferences: personaStore.softPreferences,
        conditionals: personaStore.conditionals,
      };
      const { sessionId, profileId } = await submitQuiz(id, persona, personaStore.rawAnswers);
      personaStore.setSessionId(sessionId);
      personaStore.setProfileId(profileId);
      personaStore.markComplete();
      router.push(`/shortlist?session=${sessionId}`);
    } catch (err) {
      console.error("Quiz submission failed", err);
      setIsSubmitting(false);
    }
  }

  function advance() {
    setContradiction(null);
    // Recompute active questions with the latest answers before deciding.
    const next = getActiveQuestions(personaStore.rawAnswers);
    if (stepIndex + 1 >= next.length) {
      void handleSubmit();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  function handleAnswer(value: string | string[]) {
    if (!currentStep) return;
    personaStore.setAnswer(currentStep.id, value as QuizAnswers[keyof QuizAnswers]);
    const updatedAnswers = { ...personaStore.rawAnswers, [currentStep.id]: value };
    const nudge = detectContradiction(updatedAnswers as QuizAnswers);
    if (nudge) {
      setContradiction(nudge);
      return; // pause — user reads the nudge, then continues
    }
    setTimeout(advance, 150);
  }

  function handleBack() {
    setContradiction(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  if (!mounted) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center text-gray-400 text-sm">
        Loading the quiz…
      </div>
    );
  }

  if (isSubmitting || !currentStep) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-3">
        <div className="text-3xl">🔎</div>
        <p className="font-semibold text-navy-900">Matching cars to your answers…</p>
        <p className="text-sm text-gray-500">This takes just a moment.</p>
      </div>
    );
  }

  const selectedRaw = personaStore.rawAnswers[currentStep.id];
  const selectedValues = Array.isArray(selectedRaw)
    ? selectedRaw
    : selectedRaw != null
      ? [selectedRaw]
      : [];

  return (
    <div className="max-w-xl mx-auto px-6 py-10 sm:py-14 space-y-8">
      <QuizProgress current={stepIndex + 1} total={activeQuestions.length} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
        >
          <QuizStep question={currentStep} selectedValues={selectedValues} onAnswer={handleAnswer} />
        </motion.div>
      </AnimatePresence>

      {contradiction && (
        <ContradictionNudge contradiction={contradiction} onContinue={advance} />
      )}

      {stepIndex > 0 && (
        <div>
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
