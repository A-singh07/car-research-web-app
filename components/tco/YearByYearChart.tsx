"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { YearlySnapshot } from "@/types/tco";

interface YearByYearChartProps {
  yearlyData: { label: string; snapshots: YearlySnapshot[] }[];
}

const COLORS = ["#0f2040", "#f59e0b", "#64748b", "#16a34a"];

function rupees(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
}

export function YearByYearChart({ yearlyData }: YearByYearChartProps) {
  if (yearlyData.length === 0) return null;

  // Flatten data for Recharts: [{ year: 1, "Car A": 1000, "Car B": 1200 }, ...]
  const numYears = yearlyData[0].snapshots.length;
  const data = Array.from({ length: numYears }).map((_, i) => {
    const row: Record<string, number> = { year: yearlyData[0].snapshots[i].year };
    for (const car of yearlyData) {
      row[car.label] = car.snapshots[i].netCost;
    }
    return row;
  });

  // Calculate crossover if there are exactly two cars
  let crossoverYear: number | null = null;
  let crossoverLabel = "";

  if (yearlyData.length === 2) {
    const carA = yearlyData[0];
    const carB = yearlyData[1];
    
    const initialCheaper = carA.snapshots[0].netCost <= carB.snapshots[0].netCost ? 0 : 1;
    
    for (let i = 1; i < numYears; i++) {
      const currentCheaper = carA.snapshots[i].netCost <= carB.snapshots[i].netCost ? 0 : 1;
      if (initialCheaper !== currentCheaper) {
        crossoverYear = carA.snapshots[i].year;
        const cheaperCarName = yearlyData[currentCheaper].label;
        crossoverLabel = cheaperCarName + " cheaper from year " + crossoverYear;
        break; // Only mark the first crossover
      }
    }
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
        <XAxis
          dataKey="year"
          tickFormatter={(v) => "Year " + v}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickMargin={10}
        />
        <YAxis
          tickFormatter={(v: number) => "₹" + (v / 100000).toFixed(1) + "L"}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickMargin={10}
        />
        <Tooltip formatter={(value: unknown, name: unknown) => [rupees(Number(value) || 0), name as string]} labelFormatter={(v) => "Year " + v} />
        <Legend wrapperStyle={{ paddingTop: "20px" }} />
        {crossoverYear !== null && (
          <ReferenceLine
            x={crossoverYear}
            stroke="#9ca3af"
            strokeDasharray="3 3"
            label={{ position: "top", value: crossoverLabel, fill: "#6b7280", fontSize: 12 }}
          />
        )}
        {yearlyData.map((car, index) => (
          <Line
            key={car.label}
            type="monotone"
            dataKey={car.label}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}