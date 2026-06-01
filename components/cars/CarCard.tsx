"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { AddToCompareButton } from "@/components/cars/AddToCompareButton";
import type { VariantWithModel } from "@/types/car";

interface CarCardProps {
  variant: VariantWithModel;
  matchScore?: number;
  matchReason?: string;
  onToastFull?: () => void;
  className?: string;
}

function formatPrice(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function CarCard({ variant, matchScore, matchReason, onToastFull, className }: CarCardProps) {
  const make = variant.model.make.name;
  const model = variant.model.name;
  const onRoad = variant.priceOnroadEstimate ?? Math.round(variant.priceExshowroom * 1.15);

  return (
    <div className={clsx("bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all", className)}>
      {/* Image placeholder */}
      <div className="h-36 bg-gradient-to-br from-navy-50 to-navy-100 rounded-t-xl flex items-center justify-center">
        <span className="text-4xl">🚗</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-gray-500 font-medium">{make}</p>
            <h3 className="font-bold text-gray-900 leading-tight">{model}</h3>
            <p className="text-xs text-gray-400">{variant.name}</p>
          </div>
          {matchScore != null && (
            <Badge variant="match" score={matchScore} className="shrink-0 mt-0.5">
              {matchScore}% match
            </Badge>
          )}
        </div>

        {/* Price */}
        <div>
          <p className="text-lg font-bold text-navy-900">{formatPrice(onRoad)}</p>
          <p className="text-xs text-gray-400">on-road est.</p>
        </div>

        {/* Match reason */}
        {matchReason && (
          <p className="text-xs text-gray-600 leading-relaxed border-l-2 border-accent-400 pl-2">
            {matchReason}
          </p>
        )}

        {/* Specs row */}
        <div className="flex flex-wrap gap-2">
          {variant.mileageKmpl && (
            <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
              {Number(variant.mileageKmpl).toFixed(1)} km/l
            </span>
          )}
          {variant.fuelType === "ELECTRIC" && variant.rangeKm && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              {variant.rangeKm} km range
            </span>
          )}
          {variant.ncapRating && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {variant.ncapRating}★ NCAP
            </span>
          )}
          <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full capitalize">
            {variant.fuelType.toLowerCase()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <AddToCompareButton
            variantId={variant.id}
            carName={`${make} ${model}`}
            onFull={onToastFull}
          />
          <Link
            href={`/tco?carId=${variant.id}`}
            className="text-xs text-navy-600 hover:text-navy-800 font-medium"
          >
            See full cost →
          </Link>
        </div>
      </div>
    </div>
  );
}
