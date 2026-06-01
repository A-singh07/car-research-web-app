"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import type { AnswerOption } from "@/lib/quiz-questions";

interface AnswerCardProps {
  option: AnswerOption;
  selected: boolean;
  onSelect: () => void;
}

export function AnswerCard({ option, selected, onSelect }: AnswerCardProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        "w-full text-left rounded-xl border px-5 py-4 transition-colors",
        selected
          ? "ring-2 ring-navy-500 border-navy-300 bg-navy-50"
          : "border-gray-200 bg-white hover:border-navy-300 hover:bg-navy-50/50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{option.label}</p>
          {option.sublabel && (
            <p className="text-sm text-gray-500 mt-0.5">{option.sublabel}</p>
          )}
        </div>
        <span
          className={clsx(
            "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            selected ? "border-navy-500 bg-navy-500" : "border-gray-300"
          )}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      </div>
    </motion.button>
  );
}
