import { clsx } from "clsx";

interface BadgeProps {
  variant?: "match" | "winner" | "safety" | "nudge" | "neutral";
  score?: number;
  children: React.ReactNode;
  className?: string;
}

function matchVariant(score?: number): "high" | "mid" | "low" {
  if (!score) return "low";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export function Badge({ variant = "neutral", score, children, className }: BadgeProps) {
  const matchLevel = variant === "match" ? matchVariant(score) : null;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variant === "match" && matchLevel === "high" && "bg-green-100 text-green-800",
        variant === "match" && matchLevel === "mid" && "bg-amber-100 text-amber-800",
        variant === "match" && matchLevel === "low" && "bg-gray-100 text-gray-600",
        variant === "winner" && "bg-green-100 text-green-800 ring-1 ring-green-300",
        variant === "safety" && "bg-blue-100 text-blue-800",
        variant === "nudge" && "bg-amber-100 text-amber-800",
        variant === "neutral" && "bg-gray-100 text-gray-600",
        className
      )}
    >
      {children}
    </span>
  );
}
