/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCompareStore } from "@/store/compare";
import { getVariantsByIds } from "@/lib/cars";
import { CloseIcon, ArrowRightIcon } from "@/components/ui/icons";

interface Chip {
  id: string;
  name: string;
}

export function CompareBar() {
  const carIds = useCompareStore((s) => s.carIds);
  const removeCar = useCompareStore((s) => s.removeCar);
  const clearAll = useCompareStore((s) => s.clearAll);

  const [chips, setChips] = useState<Chip[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (carIds.length === 0) {
      setChips([]);
      return;
    }
    let active = true;
    getVariantsByIds(carIds).then((variants) => {
      if (!active) return;
      // Preserve store order, fall back to the id if a variant is missing.
      const byId = new Map(variants.map((v) => [v.id, `${v.model.make.name} ${v.model.name}`]));
      setChips(carIds.map((id) => ({ id, name: byId.get(id) ?? "Car" })));
    });
    return () => {
      active = false;
    };
  }, [carIds]);

  if (!mounted || carIds.length === 0) return null;

  const canCompare = carIds.length >= 2;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="shrink-0 inline-flex items-center gap-1.5 bg-navy-50 text-navy-800 text-xs font-medium pl-3 pr-1.5 py-1.5 rounded-full"
            >
              {chip.name}
              <button
                type="button"
                onClick={() => removeCar(chip.id)}
                aria-label={`Remove ${chip.name}`}
                className="w-4 h-4 rounded-full flex items-center justify-center text-navy-500 hover:bg-navy-200 hover:text-navy-900"
              >
                <CloseIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="shrink-0 text-xs text-gray-400 hover:text-gray-600 px-2"
          >
            Clear
          </button>
        </div>

        {!canCompare && (
          <span className="hidden sm:block text-xs text-gray-400 whitespace-nowrap">
            Add at least 2 to compare
          </span>
        )}

        {canCompare ? (
          <Link
            href="/compare"
            className="shrink-0 inline-flex items-center gap-1.5 bg-navy-900 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-navy-800 transition-colors"
          >
            Compare now
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1.5 bg-gray-100 text-gray-400 text-sm font-medium px-5 py-2 rounded-full cursor-not-allowed">
            Compare now
            <ArrowRightIcon className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );
}
