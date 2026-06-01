"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPersonaSummary } from "@/lib/persona-helpers";
import { Toggle } from "@/components/ui/Toggle";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { BuyerPersona, PrimaryUse, FamilySize } from "@/types/persona";

interface PersonaBannerProps {
  persona: BuyerPersona;
  hasQuizPersona: boolean;
  editable?: boolean;
  onChange?: (persona: BuyerPersona) => void;
}

const USE_OPTIONS: { value: PrimaryUse; label: string }[] = [
  { value: "CITY_COMMUTE", label: "City commute" },
  { value: "FAMILY_TRIPS", label: "Family trips" },
  { value: "MIXED", label: "Mixed use" },
  { value: "HIGHWAY", label: "Highway" },
];

const FAMILY_OPTIONS: { value: FamilySize; label: string }[] = [
  { value: "SOLO", label: "Solo" },
  { value: "COUPLE", label: "Couple" },
  { value: "FAMILY", label: "Family" },
  { value: "LARGE_FAMILY", label: "Large family" },
];

export function PersonaBanner({ persona, hasQuizPersona, editable, onChange }: PersonaBannerProps) {
  const [editing, setEditing] = useState(false);

  function update(patch: Partial<BuyerPersona>) {
    onChange?.({ ...persona, ...patch });
  }

  return (
    <div className="bg-navy-50 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-navy-800 font-medium">{formatPersonaSummary(persona)}</p>
          {!hasQuizPersona && (
            <Link
              href="/quiz"
              className="inline-flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800 mt-1"
            >
              Take the quiz for personalised results
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
        {editable && (
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="text-xs text-navy-600 hover:text-navy-800 whitespace-nowrap shrink-0"
          >
            {editing ? "Done" : "Edit"}
          </button>
        )}
      </div>

      {editable && editing && (
        <div className="mt-4 pt-4 border-t border-navy-200 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-medium text-navy-700">Primary use</span>
            <select
              value={persona.primaryUse ?? "MIXED"}
              onChange={(e) => update({ primaryUse: e.target.value as PrimaryUse })}
              className="mt-1 w-full text-sm bg-white border border-navy-200 rounded-lg px-2.5 py-1.5"
            >
              {USE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-navy-700">Who&apos;s in the car</span>
            <select
              value={persona.familySize ?? "COUPLE"}
              onChange={(e) => update({ familySize: e.target.value as FamilySize })}
              className="mt-1 w-full text-sm bg-white border border-navy-200 rounded-lg px-2.5 py-1.5"
            >
              {FAMILY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end pb-1">
            <Toggle
              checked={persona.safetyPriority}
              onChange={(checked) => update({ safetyPriority: checked })}
              label="Safety is a priority"
            />
          </div>
        </div>
      )}
    </div>
  );
}
