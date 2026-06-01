import type { VariantWithModel } from "@/types/car";
import type { TCOResult } from "@/types/tco";
import type { BuyerPersona } from "@/types/persona";

interface TCOVerdictCardProps {
  results: { variant: VariantWithModel; tco: TCOResult }[];
  persona: BuyerPersona | null;
  ownershipYears: number;
}

function carName(v: VariantWithModel): string {
  return `${v.model.make.name} ${v.model.name}`;
}

function fmtMonthly(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function fmtL(n: number): string {
  return `₹${(n / 100000).toFixed(1)}L`;
}

export function TCOVerdictCard({ results, persona, ownershipYears }: TCOVerdictCardProps) {
  if (results.length === 0) return null;

  let body: string;

  if (results.length === 1) {
    const { variant, tco } = results[0];
    body = `The ${carName(variant)} will cost you about ${fmtMonthly(
      tco.avgMonthlyCost
    )}/month net over ${ownershipYears} years — that's ${fmtL(
      tco.netAfterResale
    )} after you recover roughly ${fmtL(tco.resaleValue)} in resale.`;
  } else {
    const sorted = [...results].sort((a, b) => a.tco.netAfterResale - b.tco.netAfterResale);
    const cheapest = sorted[0];
    const dearest = sorted[sorted.length - 1];
    const gap = dearest.tco.netAfterResale - cheapest.tco.netAfterResale;
    const reason =
      persona && persona.annualKm >= 20000 && cheapest.variant.fuelType === "DIESEL"
        ? " At your high annual mileage, its fuel efficiency does most of the work."
        : cheapest.variant.fuelType === "ELECTRIC"
          ? " Near-zero running cost is the main driver."
          : " Lower running and depreciation costs add up over time.";
    body = `The ${carName(cheapest.variant)} is ${fmtL(gap)} cheaper to own over ${ownershipYears} years than the ${carName(
      dearest.variant
    )}.${reason}`;
  }

  return (
    <div className="bg-navy-900 text-white rounded-xl p-5 shadow-md">
      <p className="text-xs uppercase tracking-wide text-navy-300 font-semibold mb-2">
        The bottom line
      </p>
      <p className="text-sm leading-relaxed text-navy-50">{body}</p>
    </div>
  );
}
