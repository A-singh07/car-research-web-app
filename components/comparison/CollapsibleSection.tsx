"use client";

import { useState } from "react";
import { SectionVerdict } from "@/components/comparison/SectionVerdict";

interface CollapsibleSectionProps {
  title: string;
  verdict?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  verdict,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-100 rounded-xl bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="sticky left-0 w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left rounded-t-xl"
      >
        <span className="font-semibold text-sm text-navy-900">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3">
          {verdict && <SectionVerdict text={verdict} />}
          {children}
        </div>
      )}
    </div>
  );
}
