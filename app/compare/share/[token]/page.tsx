import Link from "next/link";
import { getComparisonByToken } from "@/lib/comparison";
import { personaFromBuyerProfile, DEFAULT_PERSONA } from "@/lib/persona-helpers";
import { VerdictCard } from "@/components/comparison/VerdictCard";
import { PersonaBanner } from "@/components/comparison/PersonaBanner";
import { ComparisonTable } from "@/components/comparison/ComparisonTable";
import { Button } from "@/components/ui/Button";
import type { VariantWithModel } from "@/types/car";

export default async function SharedComparisonPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const comparison = await getComparisonByToken(token);

  if (!comparison || comparison.comparisonItems.length < 2) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <h1 className="text-xl font-bold text-navy-900">Comparison not found</h1>
        <p className="text-sm text-gray-500">
          This shared comparison link is invalid or has expired.
        </p>
        <Link href="/compare" className="inline-block">
          <Button>Start a new comparison</Button>
        </Link>
      </div>
    );
  }

  const variants = comparison.comparisonItems.map((item) => item.variant) as VariantWithModel[];
  const persona = comparison.buyerProfile
    ? personaFromBuyerProfile(comparison.buyerProfile)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5 pb-32">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
          Shared comparison
        </p>
        <h1 className="text-2xl font-bold text-navy-900">Comparison</h1>
      </div>

      <PersonaBanner persona={persona ?? DEFAULT_PERSONA} hasQuizPersona={persona !== null} />

      <VerdictCard variants={variants} persona={persona} />

      <ComparisonTable variants={variants} persona={persona ?? DEFAULT_PERSONA} />
    </div>
  );
}
