"use client";

import { overallVerdict } from "@/lib/verdicts";
import { DEFAULT_PERSONA } from "@/lib/persona-helpers";
import { Badge } from "@/components/ui/Badge";
import type { VariantWithModel } from "@/types/car";
import type { BuyerPersona } from "@/types/persona";

interface VerdictCardProps {
  variants: VariantWithModel[];
  persona: BuyerPersona | null;
}

export function VerdictCard({ variants, persona }: VerdictCardProps) {
  if (variants.length < 2) return null;
  const verdict = overallVerdict(variants, persona ?? DEFAULT_PERSONA);

  return (
    <div className="sticky top-14 z-30 bg-navy-900 text-white rounded-xl p-5 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs uppercase tracking-wide text-navy-300 font-semibold">
          Our verdict
        </span>
        {verdict.winnerName ? (
          <Badge variant="winner">{verdict.winnerName}</Badge>
        ) : (
          <Badge variant="nudge">Genuinely close</Badge>
        )}
      </div>
      <p className="text-sm leading-relaxed text-navy-50">{verdict.text}</p>
    </div>
  );
}
