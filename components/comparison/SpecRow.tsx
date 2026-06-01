"use client";

import { clsx } from "clsx";

interface SpecRowProps {
  label: string;
  values: (string | number | null)[];
  winnerIndex?: number;
  callout?: string;
  unit?: string;
  showOnlyDifferences?: boolean;
}

function valuesAreSimilar(values: (string | number | null)[]): boolean {
  const nonNull = values.filter((v): v is string | number => v != null);
  if (nonNull.length <= 1) return true;
  if (nonNull.every((v) => typeof v === "number")) {
    const nums = nonNull as number[];
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    if (max === 0) return true;
    return (max - min) / max <= 0.05;
  }
  return nonNull.every((v) => v === nonNull[0]);
}

function formatValue(value: string | number | null, unit?: string): string {
  if (value === null || value === undefined || value === "") return "–";
  if (typeof value === "number") {
    const formatted = value.toLocaleString("en-IN");
    return unit ? `${formatted} ${unit}` : formatted;
  }
  return unit ? `${value} ${unit}` : value;
}

export function SpecRow({
  label,
  values,
  winnerIndex,
  callout,
  unit,
  showOnlyDifferences,
}: SpecRowProps) {
  if (showOnlyDifferences && valuesAreSimilar(values)) return null;

  return (
    <div
      className="grid items-stretch border-t border-gray-50 text-sm"
      style={{ gridTemplateColumns: "var(--compare-cols)" }}
    >
      <div className="sticky left-0 z-10 bg-white py-3 pr-3">
        <p className="font-medium text-gray-700">{label}</p>
        {callout && <p className="text-xs text-gray-400 mt-0.5">{callout}</p>}
      </div>
      {values.map((value, i) => {
        const isWinner = winnerIndex === i;
        const missing = value === null || value === undefined || value === "";
        return (
          <div
            key={i}
            title={missing ? "We don't have verified data for this yet." : undefined}
            className={clsx(
              "py-3 px-3 flex items-center tabular-nums",
              isWinner && "bg-winner-bg font-semibold text-winner-text rounded-md",
              missing && "text-gray-300"
            )}
          >
            {formatValue(value, unit)}
          </div>
        );
      })}
    </div>
  );
}
