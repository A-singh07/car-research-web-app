"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_COMPARE = 4;

interface CompareState {
  carIds: string[];
  addCar: (id: string) => boolean;
  removeCar: (id: string) => void;
  clearAll: () => void;
  isFull: () => boolean;
  isAdded: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      carIds: [],

      addCar: (id) => {
        const { carIds } = get();
        if (carIds.length >= MAX_COMPARE) return false;
        if (carIds.includes(id)) return true;
        set({ carIds: [...carIds, id] });
        return true;
      },

      removeCar: (id) => set((s) => ({ carIds: s.carIds.filter((c) => c !== id) })),
      clearAll: () => set({ carIds: [] }),
      isFull: () => get().carIds.length >= MAX_COMPARE,
      isAdded: (id) => get().carIds.includes(id),
    }),
    { name: "car-research-compare" }
  )
);
