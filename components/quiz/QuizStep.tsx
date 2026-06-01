"use client";

import { useState } from "react";
import { AnswerCard } from "@/components/quiz/AnswerCard";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { QuizQuestion } from "@/lib/quiz-questions";

interface QuizStepProps {
  question: QuizQuestion;
  selectedValues: string[];
  onAnswer: (value: string | string[]) => void;
}

export function QuizStep({ question, selectedValues, onAnswer }: QuizStepProps) {
  const [multiSelection, setMultiSelection] = useState<string[]>(selectedValues);

  function toggleMulti(value: string) {
    setMultiSelection((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-navy-900 leading-snug">{question.headline}</h2>
        {question.contextNote && (
          <p className="text-sm text-gray-500 italic leading-relaxed">
            <span className="font-medium not-italic text-gray-400">Why we ask this — </span>
            {question.contextNote}
          </p>
        )}
      </div>

      <div className="grid gap-3">
        {question.options.map((option) => {
          const selected = question.multi
            ? multiSelection.includes(option.value)
            : selectedValues.includes(option.value);
          return (
            <AnswerCard
              key={option.value}
              option={option}
              selected={selected}
              onSelect={() =>
                question.multi ? toggleMulti(option.value) : onAnswer(option.value)
              }
            />
          );
        })}
      </div>

      {question.multi && (
        <div className="flex justify-end">
          <Button onClick={() => onAnswer(multiSelection)} className="gap-1.5">
            {multiSelection.length === 0 ? "Skip" : "Continue"}
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
