import { LightbulbIcon } from "@/components/ui/icons";

interface ScenarioNudgeProps {
  message: string;
}

export function ScenarioNudge({ message }: ScenarioNudgeProps) {
  return (
    <div className="rounded-lg border border-nudge-border/40 bg-nudge-bg p-3 flex gap-2.5">
      <LightbulbIcon className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-900 leading-relaxed">{message}</p>
    </div>
  );
}
