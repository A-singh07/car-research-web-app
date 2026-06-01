import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightIcon } from "@/components/ui/icons";

const FEATURES = [
  {
    title: "Guided preference quiz",
    body: "Answer a few honest questions and get a ranked shortlist — with a plain-English reason for every match.",
    href: "/quiz",
    cta: "Start the quiz",
    emoji: "🧭",
  },
  {
    title: "Side-by-side comparison",
    body: "Line up to four cars and see who wins on price, safety, space and running cost — tuned to how you'll actually use the car.",
    href: "/compare",
    cta: "Compare cars",
    emoji: "⚖️",
  },
  {
    title: "True cost calculator",
    body: "EMI, fuel, insurance, service and resale — the real ₹/month over five years, not just the showroom sticker.",
    href: "/tco",
    cta: "Calculate cost",
    emoji: "📊",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="px-6 py-20 sm:py-28 bg-gradient-to-b from-navy-50 to-background">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Badge variant="nudge" className="mx-auto">
            Honest car research · no dealer spin
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-navy-900 leading-tight tracking-tight">
            Find the car that actually fits your life.
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
            Tell us how you drive, who you carry, and what you can spend. We&apos;ll
            shortlist, compare, and budget — in plain language, with the trade-offs
            spelled out.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/quiz">
              <Button size="lg" className="gap-2">
                Take the 2-minute quiz
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/compare">
              <Button size="lg" variant="secondary">
                Jump into comparison
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-24 -mt-8">
        <div className="max-w-5xl mx-auto grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-navy-200 transition-all p-6 flex flex-col"
            >
              <span className="text-3xl">{f.emoji}</span>
              <h2 className="font-bold text-navy-900 mt-4">{f.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed mt-2 flex-1">
                {f.body}
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-navy-600 font-medium mt-4 group-hover:text-navy-800">
                {f.cta}
                <ArrowRightIcon className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
