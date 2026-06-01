"use client";

import { ResetIcon } from "@/components/ui/icons";

interface InputGroupProps {
  label: string;
  techLabel?: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
  onReset?: () => void;
}

export function InputGroup({
  label,
  techLabel,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  defaultValue,
  onReset,
}: InputGroupProps) {
  const showReset =
    onReset != null && defaultValue != null && Math.round(value) !== Math.round(defaultValue);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div>
          {techLabel && <p className="text-[11px] text-gray-400 font-medium">{techLabel}</p>}
          <label className="text-sm font-medium text-gray-700">{label}</label>
        </div>
        {showReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] text-navy-600 hover:text-navy-800"
          >
            <ResetIcon className="w-3 h-3" />
            Reset to profile
          </button>
        )}
      </div>
      <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 focus-within:border-navy-400">
        {prefix && <span className="text-sm text-gray-400 mr-1">{prefix}</span>}
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          onChange={(e) => {
            const next = Number(e.target.value);
            onChange(Number.isFinite(next) ? next : 0);
          }}
          className="flex-1 py-2 text-sm bg-transparent outline-none tabular-nums w-full"
        />
        {suffix && <span className="text-sm text-gray-400 ml-1 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );
}
