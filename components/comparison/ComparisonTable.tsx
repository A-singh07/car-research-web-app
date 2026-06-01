"use client";

import type { CSSProperties } from "react";
import { CollapsibleSection } from "@/components/comparison/CollapsibleSection";
import { SpecRow } from "@/components/comparison/SpecRow";
import {
  pricingSectionVerdict,
  performanceSectionVerdict,
  efficiencySectionVerdict,
  spaceSectionVerdict,
  safetySectionVerdict,
  ownershipSectionVerdict,
} from "@/lib/verdicts";
import { getFuelPrice } from "@/lib/fuel-prices";
import type { VariantWithModel } from "@/types/car";
import type { BuyerPersona } from "@/types/persona";

interface ComparisonTableProps {
  variants: VariantWithModel[];
  persona: BuyerPersona;
  showOnlyDifferences?: boolean;
}

interface RowSpec {
  label: string;
  values: (string | number | null)[];
  winnerIndex?: number;
  callout?: string;
}

interface SectionSpec {
  key: string;
  title: string;
  verdict: string;
  rows: RowSpec[];
}

const SAFETY_FEATURES: Record<string, string> = {
  adas: "ADAS",
  abs: "ABS",
  esp: "ESP",
  isofix: "ISOFIX mounts",
  hill_assist: "Hill assist",
  tpms: "Tyre pressure monitor",
  "360_camera": "360° camera",
  blind_spot: "Blind-spot monitor",
};

function fmtL(n: number): string {
  return `₹${(n / 100000).toFixed(1)}L`;
}

function onRoadOf(v: VariantWithModel): number {
  return v.priceOnroadEstimate ?? Math.round(v.priceExshowroom * 1.15);
}

function emi(principal: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function bestIndex(values: (number | null)[], dir: "min" | "max"): number | undefined {
  const present = values
    .map((n, i) => ({ n, i }))
    .filter((x): x is { n: number; i: number } => x.n != null);
  if (present.length < 2) return undefined;
  const nums = present.map((x) => x.n);
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  if (lo === hi) return undefined;
  const target = dir === "min" ? lo : hi;
  return present.find((x) => x.n === target)!.i;
}

function getFeatures(v: VariantWithModel): string[] {
  return Array.isArray(v.featuresList) ? (v.featuresList as string[]) : [];
}

function monthlyFuelCost(v: VariantWithModel, annualKm: number): number | null {
  const km = annualKm / 12;
  if (v.fuelType === "ELECTRIC") return null; // shown as range instead
  const mileage = Number(v.mileageKmpl ?? 0);
  if (!mileage) return null;
  const priceType = v.fuelType === "DIESEL" ? "DIESEL" : v.fuelType === "CNG" ? "CNG" : "PETROL";
  return Math.round((km / mileage) * getFuelPrice("Delhi", priceType));
}

function buildSections(variants: VariantWithModel[], persona: BuyerPersona): SectionSpec[] {
  const onRoads = variants.map(onRoadOf);
  const powers = variants.map((v) => v.powerBhp);
  const torques = variants.map((v) => v.torqueNm);
  const mileages = variants.map((v) => (v.mileageKmpl != null ? Number(v.mileageKmpl) : null));
  const monthlyFuel = variants.map((v) => monthlyFuelCost(v, persona.annualKm));
  const boots = variants.map((v) => v.bootSpaceLitres);
  const clearances = variants.map((v) => v.groundClearanceMm);
  const turnings = variants.map((v) => (v.turningRadiusM != null ? Number(v.turningRadiusM) : null));
  const ncaps = variants.map((v) => v.ncapRating);
  const airbags = variants.map((v) => v.airbagCount);
  const emis = variants.map((v) => Math.round(emi(onRoadOf(v), 8.5, 60)));
  const annualService = variants.map((v) => {
    const oc = v.ownershipCost;
    if (!oc?.serviceCostPerVisit || !oc.serviceIntervalKm) return null;
    return Math.round((persona.annualKm / oc.serviceIntervalKm) * oc.serviceCostPerVisit);
  });

  // Torque row only shown when the spread is meaningful (>10%).
  const torquePresent = torques.filter((t): t is number => t != null);
  const torqueSpread =
    torquePresent.length >= 2
      ? (Math.max(...torquePresent) - Math.min(...torquePresent)) / Math.max(...torquePresent)
      : 0;

  const pricing: SectionSpec = {
    key: "pricing",
    title: "Pricing",
    verdict: pricingSectionVerdict(variants, persona),
    rows: [
      {
        label: "Ex-showroom price",
        values: variants.map((v) => fmtL(v.priceExshowroom)),
        winnerIndex: bestIndex(
          variants.map((v) => v.priceExshowroom),
          "min"
        ),
      },
      {
        label: "On-road estimate",
        values: onRoads.map(fmtL),
        winnerIndex: bestIndex(onRoads, "min"),
      },
      {
        label: "EMI · 8.5% / 60 months",
        values: emis.map((e) => `₹${e.toLocaleString("en-IN")}/mo`),
        winnerIndex: bestIndex(emis, "min"),
      },
    ],
  };

  const performance: SectionSpec = {
    key: "performance",
    title: "Real-World Performance",
    verdict: performanceSectionVerdict(variants, persona),
    rows: [
      {
        label: "Power",
        values: variants.map((v) => (v.powerBhp != null ? `${v.powerBhp} bhp` : null)),
        winnerIndex: bestIndex(powers, "max"),
      },
      ...(torqueSpread > 0.1
        ? [
            {
              label: "Torque",
              values: variants.map((v) => (v.torqueNm != null ? `${v.torqueNm} Nm` : null)),
              winnerIndex: bestIndex(torques, "max"),
            },
          ]
        : []),
      {
        label: "Transmission",
        values: variants.map((v) => v.transmission),
        callout: "Automatics ease stop-go city traffic",
      },
    ],
  };

  const efficiency: SectionSpec = {
    key: "efficiency",
    title: "Efficiency & Running Cost",
    verdict: efficiencySectionVerdict(variants, persona),
    rows: [
      {
        label: "Certified mileage",
        values: variants.map((v) => (v.mileageKmpl != null ? `${Number(v.mileageKmpl)} km/l` : null)),
        winnerIndex: bestIndex(mileages, "max"),
        callout: "Expect 10–15% less in city traffic",
      },
      {
        label: "Est. monthly fuel cost",
        values: monthlyFuel.map((m) => (m != null ? `₹${m.toLocaleString("en-IN")}/mo` : null)),
        winnerIndex: bestIndex(monthlyFuel, "min"),
        callout: `Based on ${Math.round(persona.annualKm / 12).toLocaleString("en-IN")} km/month`,
      },
      {
        label: "Range (EV)",
        values: variants.map((v) =>
          v.fuelType === "ELECTRIC" && v.rangeKm != null ? `${v.rangeKm} km` : null
        ),
        winnerIndex: bestIndex(
          variants.map((v) => (v.fuelType === "ELECTRIC" ? v.rangeKm : null)),
          "max"
        ),
      },
    ],
  };

  const space: SectionSpec = {
    key: "space",
    title: "Space & Practicality",
    verdict: spaceSectionVerdict(variants, persona),
    rows: [
      {
        label: "Boot space",
        values: variants.map((v) => (v.bootSpaceLitres != null ? `${v.bootSpaceLitres} L` : null)),
        winnerIndex: bestIndex(boots, "max"),
        callout: "~40L per cabin-size suitcase",
      },
      {
        label: "Ground clearance",
        values: variants.map((v) =>
          v.groundClearanceMm != null ? `${v.groundClearanceMm} mm` : null
        ),
        winnerIndex: bestIndex(clearances, "max"),
      },
      {
        label: "Turning radius",
        values: variants.map((v) =>
          v.turningRadiusM != null ? `${Number(v.turningRadiusM)} m` : null
        ),
        winnerIndex: bestIndex(turnings, "min"),
        callout: "Smaller is easier to park",
      },
    ],
  };

  const safety: SectionSpec = {
    key: "safety",
    title: "Safety",
    verdict: safetySectionVerdict(variants, persona),
    rows: [
      {
        label: "NCAP rating",
        values: variants.map((v) => (v.ncapRating != null ? `${v.ncapRating}-star` : null)),
        winnerIndex: bestIndex(ncaps, "max"),
      },
      {
        label: "Airbags",
        values: variants.map((v) => v.airbagCount),
        winnerIndex: bestIndex(airbags, "max"),
      },
      {
        label: "Key safety features",
        values: variants.map((v) => {
          const feats = getFeatures(v)
            .filter((f) => SAFETY_FEATURES[f])
            .map((f) => SAFETY_FEATURES[f]);
          return feats.length ? feats.join(", ") : null;
        }),
      },
    ],
  };

  const ownership: SectionSpec = {
    key: "ownership",
    title: "Ownership Experience",
    verdict: ownershipSectionVerdict(variants),
    rows: [
      {
        label: "Service interval",
        values: variants.map((v) =>
          v.ownershipCost?.serviceIntervalKm != null
            ? `${v.ownershipCost.serviceIntervalKm.toLocaleString("en-IN")} km`
            : null
        ),
      },
      {
        label: "Est. annual service",
        values: annualService.map((a) => (a != null ? `₹${a.toLocaleString("en-IN")}` : null)),
        winnerIndex: bestIndex(annualService, "min"),
      },
      {
        label: "Service network",
        values: variants.map((v) => {
          const tier = v.model.make.serviceNetworkTier;
          return tier ? tier.charAt(0) + tier.slice(1).toLowerCase() : null;
        }),
      },
    ],
  };

  const ordered = persona.safetyPriority
    ? [safety, pricing, performance, efficiency, space, ownership]
    : [pricing, performance, efficiency, space, safety, ownership];

  return ordered;
}

export function ComparisonTable({ variants, persona, showOnlyDifferences }: ComparisonTableProps) {
  const n = variants.length;
  const sections = buildSections(variants, persona);
  const style = {
    "--compare-cols": `minmax(150px,1.3fr) repeat(${n}, minmax(150px,1fr))`,
    minWidth: 160 + n * 165,
  } as CSSProperties;

  return (
    <div className="overflow-x-auto pb-2">
      <div style={style} className="space-y-3">
        {/* Column header — car names */}
        <div className="grid" style={{ gridTemplateColumns: "var(--compare-cols)" }}>
          <div className="sticky left-0 bg-background" />
          {variants.map((v) => (
            <div key={v.id} className="px-3 py-2">
              <p className="font-bold text-navy-900 leading-tight">
                {v.model.make.name} {v.model.name}
              </p>
              <p className="text-xs text-gray-400">{v.name}</p>
            </div>
          ))}
        </div>

        {sections.map((section) => (
          <CollapsibleSection key={section.key} title={section.title} verdict={section.verdict}>
            {section.rows.map((row) => (
              <SpecRow key={row.label} {...row} showOnlyDifferences={showOnlyDifferences} />
            ))}
          </CollapsibleSection>
        ))}
      </div>
    </div>
  );
}
