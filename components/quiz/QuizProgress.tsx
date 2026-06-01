"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";

interface QuizProgressProps {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  return <ProgressBar current={current} total={total} label={`Question ${current} of ${total}`} />;
}
