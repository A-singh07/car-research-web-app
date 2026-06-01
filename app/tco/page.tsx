/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useActivePersona, DEFAULT_PERSONA } from "@/lib/persona-helpers";
import { getFuelPrice } from "@/lib/fuel-prices";
import { getVariantsByIds } from "@/lib/cars";
import { calculateTCO, getScenarioNudges } from "@/lib/tco";
import { TCOVerdictCard } from "@/components/tco/TCOVerdictCard";
import { CostBreakdownChart } from "@/components/tco/CostBreakdownChart";
import { YearByYearChart } from "@/components/tco/YearByYearChart";
import { ScenarioNudge } from "@/components/tco/ScenarioNudge";
import { InputGroup } from "@/components/tco/InputGroup";
import { Collapsible } from "@/components/ui/Collapsible";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { VariantWithModel } from "@/types/car";
import type { TCOInput } from "@/types/tco";

interface TCOFormState {
  downPayment: number;
  loanTenureMonths: number;
  interestRate: number;
  annualKm: number;
  ownershipYears: number;
  electricityTariff: number;
  // Dynamic per car, but for simplicity we keep global offsets or keep it simple
  // In a real app we might allow per-car price edits, but the spec says "onRoadPrice: variant.priceOnroadEstimate"
}

function TCOContent() {
  const searchParams = useSearchParams();
  const carId = searchParams.get("carId");
  const carIdsParam = searchParams.get("carIds");
  
  const { persona, hasQuizPersona } = useActivePersona();
  
  const [mounted, setMounted] = useState(false);
  const [variants, setVariants] = useState<VariantWithModel[] | null>(null);

  const defaultDownPayment = Math.round((persona.budgetMax ?? DEFAULT_PERSONA.budgetMax) * 0.20);
  
  const [input, setInput] = useState<TCOFormState>({
    downPayment: defaultDownPayment,
    loanTenureMonths: 60,
    interestRate: 8.5,
    annualKm: persona.annualKm ?? DEFAULT_PERSONA.annualKm,
    ownershipYears: 5,
    electricityTariff: 8,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let ids: string[] = [];
    if (carIdsParam) {
      ids = carIdsParam.split(",");
    } else if (carId) {
      ids = [carId];
    }
    
    if (ids.length > 0) {
      let active = true;
      getVariantsByIds(ids).then((fetched) => {
        if (!active) return;
        setVariants(fetched);
      });
      return () => { active = false; };
    } else {
      setVariants([]);
    }
  }, [carId, carIdsParam]);

  const results = useMemo(() => {
    if (!variants) return [];
    
    return variants.map(variant => {
      const fuelType = variant.fuelType ?? "PETROL";
      // We parse fuel price here per variant fuelType
      const tcoInput: TCOInput = {
        onRoadPrice: variant.priceOnroadEstimate ?? 0,
        downPayment: input.downPayment,
        loanTenureMonths: input.loanTenureMonths,
        interestRatePercent: input.interestRate,
        annualKm: input.annualKm,
        ownershipYears: input.ownershipYears,
        fuelPricePerLitre: getFuelPrice("Delhi", fuelType as "PETROL" | "DIESEL" | "CNG"),
        electricityTariffPerKwh: input.electricityTariff,
        mileageKmpl: variant.mileageKmpl ? Number(variant.mileageKmpl) : null,
        rangeKm: variant.rangeKm ? Number(variant.rangeKm) : null,
        isElectric: fuelType === "ELECTRIC",
      };
      
      const tco = calculateTCO(tcoInput, variant.ownershipCost);
      const nudges = getScenarioNudges(tcoInput, fuelType);
      
      return {
        variant,
        tco,
        tcoInput,
        nudges,
        label: variant.model.make.name + " " + variant.model.name,
      };
    });
  }, [variants, input]);

  if (!mounted || variants === null) {
    return <div className="p-8 text-center text-gray-500">Loading calculator...</div>;
  }

  if (variants.length === 0) {
    return <div className="p-8 text-center text-gray-500">No cars selected for TCO calculation.</div>;
  }

  // Pre-fill banners
  const bannerText = hasQuizPersona 
    ? "Pre-filled from your profile — adjust anything." 
    : "Using defaults — take the quiz for personalised figures.";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-32">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 mb-2">True Cost of Ownership</h1>
        <Badge variant={hasQuizPersona ? "match" : "nudge"}>{bannerText}</Badge>
      </div>

      <TCOVerdictCard results={results.map(r => ({ variant: r.variant, tco: r.tco }))} persona={persona} ownershipYears={input.ownershipYears} />

      {/* Metrics Row */}
      {results.length === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Total spend</p>
            <p className="font-semibold text-lg text-navy-900">₹{Math.round(results[0].tco.totalSpend).toLocaleString("en-IN")}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Net after resale</p>
            <p className="font-semibold text-lg text-navy-900">₹{Math.round(results[0].tco.netAfterResale).toLocaleString("en-IN")}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Avg monthly cost</p>
            <p className="font-semibold text-lg text-navy-900">₹{Math.round(results[0].tco.avgMonthlyCost).toLocaleString("en-IN")}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Monthly EMI</p>
            <p className="font-semibold text-lg text-navy-900">₹{Math.round(results[0].tco.monthlyEmi).toLocaleString("en-IN")}</p>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="space-y-8">
        <Card className="p-6">
          <h3 className="font-semibold text-navy-900 mb-4">Cost Breakdown (5 Years)</h3>
          <CostBreakdownChart results={results.map(r => ({ label: r.label, breakdown: r.tco.breakdown }))} />
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-navy-900 mb-4">Year-by-Year Cumulative Cost</h3>
          <YearByYearChart yearlyData={results.map(r => ({ label: r.label, snapshots: r.tco.yearByYear }))} />
        </Card>
      </div>

      {/* Scenario Nudges */}
      <div className="space-y-3">
        {results.flatMap(r => r.nudges).map((nudge, idx) => (
          <ScenarioNudge key={idx} message={nudge.message} />
        ))}
      </div>

      {/* Inputs Section */}
      <div className="space-y-6">
        <h3 className="font-semibold text-xl text-navy-900">Adjust Parameters</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <InputGroup
            label="Down payment"
            techLabel="Initial amount paid"
            value={input.downPayment}
            onChange={(v) => setInput(s => ({ ...s, downPayment: v }))}
            prefix="₹"
            min={0}
            defaultValue={defaultDownPayment}
            onReset={() => setInput(s => ({ ...s, downPayment: defaultDownPayment }))}
          />
          <InputGroup
            label="Annual driving distance"
            techLabel="Kilometers per year"
            value={input.annualKm}
            onChange={(v) => setInput(s => ({ ...s, annualKm: v }))}
            suffix="km/year"
            min={1000}
            defaultValue={persona.annualKm ?? DEFAULT_PERSONA.annualKm}
            onReset={() => setInput(s => ({ ...s, annualKm: persona.annualKm ?? DEFAULT_PERSONA.annualKm }))}
          />
          <InputGroup
            label="Loan tenure"
            value={input.loanTenureMonths}
            onChange={(v) => setInput(s => ({ ...s, loanTenureMonths: v }))}
            suffix="months"
            min={12}
            max={84}
          />
          <InputGroup
            label="Ownership years"
            value={input.ownershipYears}
            onChange={(v) => setInput(s => ({ ...s, ownershipYears: v }))}
            suffix="years"
            min={1}
            max={10}
          />
        </div>

        <Collapsible title="Fine-tune rates (Interest, Electricity, etc.)">
          <div className="p-5 grid sm:grid-cols-2 gap-6 border-t border-gray-100 bg-gray-50">
            <InputGroup
              label="Interest Rate"
              value={input.interestRate}
              onChange={(v) => setInput(s => ({ ...s, interestRate: v }))}
              suffix="%"
              min={0}
              max={20}
            />
            <InputGroup
              label="Electricity Tariff"
              techLabel="For EVs only"
              value={input.electricityTariff}
              onChange={(v) => setInput(s => ({ ...s, electricityTariff: v }))}
              prefix="₹"
              suffix="/kWh"
              min={0}
            />
          </div>
        </Collapsible>
      </div>

    </div>
  );
}

export default function TCOPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading TCO data...</div>}>
      <TCOContent />
    </Suspense>
  );
}
