/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePersonaStore } from "@/store/persona";
import { getShortlistForSession } from "@/lib/quiz";
import { CarCard } from "@/components/cars/CarCard";
import { Toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { MatchedCar } from "@/types/car";

const FAMILY_LABELS: Record<string, string> = {
  SOLO: "solo",
  COUPLE: "couple",
  FAMILY: "family",
  LARGE_FAMILY: "large family",
};
const USE_LABELS: Record<string, string> = {
  CITY_COMMUTE: "city commute",
  FAMILY_TRIPS: "weekend trips",
  HIGHWAY: "highway",
  MIXED: "mixed-use",
};

function budgetLabel(budgetMax: number): string {
  if (budgetMax >= 99000000) return "above ₹40L";
  return `₹${(budgetMax / 100000).toFixed(0)}L`;
}

function ShortlistContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const familySize = usePersonaStore((s) => s.familySize);
  const primaryUse = usePersonaStore((s) => s.primaryUse);
  const budgetMax = usePersonaStore((s) => s.budgetMax);

  const [results, setResults] = useState<MatchedCar[] | null>(null);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError(true);
      return;
    }
    let active = true;
    getShortlistForSession(sessionId)
      .then((r) => {
        if (active) setResults(r as MatchedCar[]);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [sessionId]);

  if (error || !sessionId) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <p className="text-gray-600">We couldn&apos;t load your shortlist.</p>
        <Link href="/quiz">
          <Button>Retake the quiz</Button>
        </Link>
      </div>
    );
  }

  if (results === null) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center text-gray-400 text-sm">
        Loading your matches…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      {/* Persona banner */}
      <div className="bg-navy-50 rounded-xl p-4 flex justify-between items-center gap-4">
        <p className="text-sm text-navy-800 leading-relaxed">
          You&apos;re looking for a{" "}
          <span className="font-semibold">
            {FAMILY_LABELS[familySize ?? "COUPLE"] ?? "everyday"}
          </span>{" "}
          <span className="font-semibold">{USE_LABELS[primaryUse ?? "MIXED"] ?? "daily"}</span>{" "}
          car, budget up to <span className="font-semibold">{budgetLabel(budgetMax)}</span>.
        </p>
        <Link
          href="/quiz"
          className="inline-flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800 whitespace-nowrap"
        >
          Edit answers
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-navy-900">Your shortlist</h1>
        <p className="text-sm text-gray-500 mt-1">
          {results.length} {results.length === 1 ? "car" : "cars"} matched, ranked by fit.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center space-y-2">
          <p className="text-gray-700 font-medium">No matches yet.</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            We couldn&apos;t find cars that match all your criteria. Try adjusting your budget or
            safety preference.
          </p>
          <Link href="/quiz" className="inline-block pt-2">
            <Button variant="secondary" size="sm">
              Adjust answers
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((m) => (
            <CarCard
              key={m.variant.id}
              variant={m.variant}
              matchScore={m.matchScore}
              matchReason={m.matchReason}
              onToastFull={() => setToast("You've got 4 already — remove one to add this.")}
            />
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function ShortlistPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-6 py-24 text-center text-gray-400 text-sm">
          Loading…
        </div>
      }
    >
      <ShortlistContent />
    </Suspense>
  );
}
