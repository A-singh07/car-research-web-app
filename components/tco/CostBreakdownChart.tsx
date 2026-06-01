"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TCOBreakdown } from "@/types/tco";

interface CostBreakdownChartProps {
  results: { label: string; breakdown: TCOBreakdown }[];
}

const SEGMENTS: { key: keyof TCOBreakdown; name: string; color: string }[] = [
  { key: "loan", name: "Loan", color: "#0f2040" },
  { key: "fuel", name: "Fuel", color: "#f59e0b" },
  { key: "insurance", name: "Insurance", color: "#64748b" },
  { key: "service", name: "Service", color: "#16a34a" },
  { key: "tyres", name: "Tyres", color: "#9ca3af" },
];

function rupees(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function CostBreakdownChart({ results }: CostBreakdownChartProps) {
  const data = results.map((r) => ({ label: r.label, ...r.breakdown }));
  const height = Math.max(140, results.length * 80 + 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
        <XAxis
          type="number"
          tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tick={{ fontSize: 12, fill: "#374151" }}
        />
        <Tooltip formatter={(value: unknown, name: unknown) => [rupees(Number(value) || 0), name as string]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {SEGMENTS.map((seg) => (
          <Bar key={seg.key} dataKey={seg.key} name={seg.name} stackId="cost" fill={seg.color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
