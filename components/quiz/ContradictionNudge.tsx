"use client";

import { motion } from "framer-motion";
import { LightbulbIcon, ArrowRightIcon } from "@/components/ui/icons";
import type { Contradiction } from "@/types/persona";

interface ContradictionNudgeProps {
  contradiction: Contradiction;
  onContinue: () => void;
}

export function ContradictionNudge({ contradiction, onContinue }: ContradictionNudgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-nudge-border/40 bg-nudge-bg p-4 flex gap-3"
    >
      <LightbulbIcon className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
      <div className="space-y-2">
        <p className="text-sm text-amber-900 leading-relaxed">{contradiction.message}</p>
        {contradiction.suggestion && (
          <p className="text-sm text-amber-800/80 leading-relaxed">{contradiction.suggestion}</p>
        )}
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 hover:text-amber-950"
        >
          Continue anyway
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
