"use client";

import { useState } from "react";
import { useCompareStore } from "@/store/compare";

interface AddToCompareButtonProps {
  variantId: string;
  carName: string;
  onFull?: () => void;
}

export function AddToCompareButton({ variantId, carName, onFull }: AddToCompareButtonProps) {
  const { addCar, removeCar, isAdded } = useCompareStore();
  const [bounce, setBounce] = useState(false);
  const added = isAdded(variantId);

  function handleClick() {
    if (added) {
      removeCar(variantId);
      return;
    }
    const success = addCar(variantId);
    if (!success) {
      onFull?.();
      return;
    }
    setBounce(true);
    setTimeout(() => setBounce(false), 300);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${bounce ? "scale-95" : "scale-100"} ${
        added
          ? "border-navy-500 bg-navy-50 text-navy-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
          : "border-gray-200 text-gray-500 hover:border-navy-300 hover:text-navy-700 hover:bg-navy-50"
      }`}
      aria-label={added ? `Remove ${carName} from compare` : `Add ${carName} to compare`}
    >
      {added ? "✓ Added" : "+ Compare"}
    </button>
  );
}
