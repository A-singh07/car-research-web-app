/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCompareStore } from "@/store/compare";
import { useSessionStore } from "@/store/session";
import { usePersonaStore } from "@/store/persona"; // read-only: profileId for share metadata
import { useActivePersona, isValidComparison } from "@/lib/persona-helpers";
import { getVariantsByIds } from "@/lib/cars";
import { createComparison } from "@/lib/comparison";
import { VerdictCard } from "@/components/comparison/VerdictCard";
import { PersonaBanner } from "@/components/comparison/PersonaBanner";
import { ComparisonTable } from "@/components/comparison/ComparisonTable";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { ShareIcon, CheckIcon, ArrowRightIcon } from "@/components/ui/icons";
import type { VariantWithModel } from "@/types/car";
import type { BuyerPersona } from "@/types/persona";

export default function ComparePage() {
  const carIds = useCompareStore((s) => s.carIds);
  const userId = useSessionStore((s) => s.userId);
  const profileId = usePersonaStore((s) => s.profileId);
  const { persona: activePersona, hasQuizPersona } = useActivePersona();

  const [mounted, setMounted] = useState(false);
  const [variants, setVariants] = useState<VariantWithModel[] | null>(null);
  const [override, setOverride] = useState<BuyerPersona | null>(null);
  const [showOnlyDiff, setShowOnlyDiff] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const persona = override ?? activePersona;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (carIds.length === 0) {
      setVariants([]);
      return;
    }
    let active = true;
    getVariantsByIds(carIds).then((fetched) => {
      if (!active) return;
      // Preserve the order the user added cars in.
      const byId = new Map(fetched.map((v) => [v.id, v]));
      setVariants(carIds.map((id) => byId.get(id)).filter((v): v is VariantWithModel => !!v));
    });
    return () => {
      active = false;
    };
  }, [carIds]);

  const valid = useMemo(() => isValidComparison(carIds), [carIds]);

  async function handleShare() {
    if (!variants || variants.length < 2) return;
    setSharing(true);
    try {
      const { shareToken } = await createComparison(carIds, persona, userId, profileId);
      const url = `${window.location.origin}/compare/share/${shareToken}`;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (err) {
      console.error("Failed to create shareable comparison", err);
    } finally {
      setSharing(false);
    }
  }

  if (!mounted || variants === null) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center text-gray-400 text-sm">
        Loading comparison…
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <h1 className="text-xl font-bold text-navy-900">Add cars to compare</h1>
        <p className="text-sm text-gray-500">
          Pick at least two cars to see them side by side. Add cars from your shortlist or browse
          results from the quiz.
        </p>
        <Link href="/quiz" className="inline-block">
          <Button className="gap-2">
            Take the quiz
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5 pb-32">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Comparison</h1>
        <Button variant="secondary" size="sm" onClick={handleShare} disabled={sharing} className="gap-1.5">
          {shareCopied ? (
            <>
              <CheckIcon className="w-4 h-4" />
              Link copied
            </>
          ) : (
            <>
              <ShareIcon className="w-4 h-4" />
              Share
            </>
          )}
        </Button>
      </div>

      <PersonaBanner
        persona={persona}
        hasQuizPersona={hasQuizPersona}
        editable
        onChange={setOverride}
      />

      <VerdictCard variants={variants} persona={persona} />

      <div className="flex justify-end">
        <Toggle checked={showOnlyDiff} onChange={setShowOnlyDiff} label="Show only differences" />
      </div>

      <ComparisonTable variants={variants} persona={persona} showOnlyDifferences={showOnlyDiff} />
    </div>
  );
}
