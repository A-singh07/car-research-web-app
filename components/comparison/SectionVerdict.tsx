interface SectionVerdictProps {
  text: string;
}

export function SectionVerdict({ text }: SectionVerdictProps) {
  if (!text) return null;
  return (
    <div className="sticky left-0 bg-navy-50/70 text-navy-800 text-sm leading-relaxed rounded-lg px-3 py-2 mb-1">
      {text}
    </div>
  );
}
