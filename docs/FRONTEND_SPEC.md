# Frontend Specification — Phase 1 MVP
## Features 2 · 3 · 5: Quiz · Comparison · TCO Calculator

**Stack:** Next.js 16 App Router · React 19 · Tailwind v4 · Zustand · Framer Motion · Recharts  
**Pattern:** Server Components by default; `'use client'` only at leaves that need state/effects

---

## Shared Infrastructure

### State Stores (Zustand + localStorage persistence)

| Store | File | Purpose |
|-------|------|---------|
| `useSessionStore` | `store/session.ts` | Anonymous userId (DB UUID) |
| `usePersonaStore` | `store/persona.ts` | Quiz answers + computed persona fields |
| `useCompareStore` | `store/compare.ts` | Up to 4 variant IDs for comparison |

**Session init flow:**  
On first meaningful action (quiz start), the app calls `getOrCreateAnonymousUser(crypto.randomUUID())`, stores the returned DB `user.id` in `useSessionStore`. Every subsequent server action uses this `userId`.

### Design Tokens
All tokens live in `app/globals.css` `@theme` block:
- Navy palette: `navy-50` → `navy-950`
- Amber accent: `accent-100` → `accent-600`
- Semantic: `winner-bg/text/ring`, `nudge-bg/border`, `match-high/mid/low`

### Shared Components

| Component | Location | Description |
|-----------|----------|-------------|
| `Button` | `components/ui/Button.tsx` | primary / secondary / ghost variants, sm/md/lg sizes |
| `Badge` | `components/ui/Badge.tsx` | match (score-coloured) / winner / safety / nudge / neutral |
| `Card` | `components/ui/Card.tsx` | base white card, optional hover + selected ring |
| `ProgressBar` | `components/ui/ProgressBar.tsx` | step progress ("2 of 5") |
| `Toggle` | `components/ui/Toggle.tsx` | on/off switch with label |
| `Collapsible` | `components/ui/Collapsible.tsx` | expandable section with chevron |
| `Toast` | `components/ui/Toast.tsx` | ephemeral bottom toast, auto-dismisses |
| `CarCard` | `components/cars/CarCard.tsx` | car tile with match score, reason, actions |
| `AddToCompareButton` | `components/cars/AddToCompareButton.tsx` | writes to `useCompareStore` |

---

## Parallel Development Guide

Features 2, 3, and 5 can be built simultaneously. The rules below define what each feature owns, what it borrows, and what it must never touch.

### File Ownership Matrix

| Feature | Creates / modifies | Reads (shared — do not modify) | Never touches |
|---------|-------------------|-------------------------------|---------------|
| **F2 — Quiz** | `app/quiz/` · `app/shortlist/` · `components/quiz/` | `lib/quiz.ts` · `lib/quiz-questions.ts` · `lib/users.ts` · `lib/scoring.ts` · `store/persona.ts` *(write)* · `store/session.ts` *(write)* · `components/ui/*` · `components/cars/CarCard` | `components/comparison/` · `components/tco/` · `app/compare/` · `app/tco/` · `store/compare.ts` |
| **F3 — Comparison** | `app/compare/` · `components/comparison/` · `app/layout.tsx` *(one line)* | `lib/comparison.ts` · `lib/verdicts.ts` · `lib/cars.ts` · `lib/persona-helpers.ts` · `store/compare.ts` *(read)* · `components/ui/*` · `components/cars/CarCard` | `store/persona.ts` *(never import)* · `components/quiz/` · `components/tco/` · `app/quiz/` · `app/tco/` |
| **F5 — TCO** | `app/tco/` · `components/tco/` | `lib/tco.ts` · `lib/cars.ts` · `lib/fuel-prices.ts` · `lib/persona-helpers.ts` · `components/ui/*` | `store/persona.ts` *(never import)* · `components/quiz/` · `components/comparison/` · `app/quiz/` · `app/compare/` |
| **F8 — Landing** | `app/page.tsx` · `app/layout.tsx` *(one line)* | `components/ui/Button` · `components/ui/Badge` | All feature-specific components |

### Persona Access Rule

> **Features 3 and 5 must never import `store/persona.ts` directly.**  
> Use `lib/persona-helpers.ts` instead. This shields them from changes to the quiz store's internal shape.

```ts
// ✅ CORRECT — used by F3 and F5
import { useActivePersona, personaFromBuyerProfile, formatPersonaSummary } from "@/lib/persona-helpers";
const { persona, hasQuizPersona } = useActivePersona();
// hasQuizPersona === false → persona is DEFAULT_PERSONA, show "Take the quiz for personalised results" banner

// ❌ WRONG — only F2 (Quiz) imports this directly
import { usePersonaStore } from "@/store/persona";
```

### Layout Slots

`app/layout.tsx` has two named slot functions. Each feature makes **exactly one substitution** — nothing else in that file changes.

| Feature | Change to make |
|---------|---------------|
| **F3 — Comparison** | Replace `<CompareBarSlot />` body with: `import { CompareBar } from "@/components/comparison/CompareBar"; return <CompareBar />;` |
| **F8 — Landing** | Replace `<SiteHeaderSlot />` body with the real `<SiteHeader />` component (create `components/layout/SiteHeader.tsx`) |

No other feature modifies `app/layout.tsx`.

---

## Feature 2 — Guided Preference Quiz

### Isolation Contract

| | |
|--|--|
| **Owns** | `app/quiz/page.tsx` · `app/shortlist/page.tsx` · `components/quiz/*` |
| **Store writes** | `usePersonaStore` (setAnswer, setSessionId, setProfileId, markComplete) · `useSessionStore` (setUserId) |
| **Server actions** | `submitQuiz()` · `getShortlistForSession()` from `lib/quiz.ts` · `getOrCreateAnonymousUser()` from `lib/users.ts` |
| **Layout** | No changes |
| **Key rule** | Only this feature writes to `usePersonaStore`. F3 and F5 read persona via `useActivePersona()` from `lib/persona-helpers.ts`. |

### Route
`app/quiz/page.tsx` — **Client Component** (`'use client'`)

### Page State
```ts
const [stepIndex, setStepIndex] = useState(0);
const [isSubmitting, setIsSubmitting] = useState(false);
const [contradiction, setContradiction] = useState<Contradiction | null>(null);
```
`usePersonaStore` stores all answers persistently.

### Question Flow
Questions sourced from `lib/quiz-questions.ts` (`QUIZ_QUESTIONS[]`).

1. `getActiveQuestions(answers)` re-evaluates after every answer to include/exclude conditional follow-ups.
2. `currentStep = activeQuestions[stepIndex]`
3. Progress bar shows `stepIndex + 1` of `activeQuestions.length` (total is dynamic as conditionals appear).

**Step render pattern:**
```
<AnimatePresence mode="wait">
  <motion.div
    key={currentStep.id}
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -40 }}
    transition={{ duration: 0.2 }}
  >
    <QuizStep question={currentStep} onAnswer={handleAnswer} />
  </motion.div>
</AnimatePresence>
```

### Answer Handling
```ts
function handleAnswer(value: string | string[]) {
  personaStore.setAnswer(currentStep.id, value);
  const updatedAnswers = { ...personaStore.rawAnswers, [currentStep.id]: value };
  const nudge = detectContradiction(updatedAnswers);
  setContradiction(nudge);
  // Move to next step after short delay to let animation start
  setTimeout(() => {
    setStepIndex(i => i + 1);
  }, nudge ? 0 : 150);
}
```

If a contradiction is detected, `ContradictionNudge` is shown below the answer cards. The user can continue anyway (nudge is informational, not blocking).

### Submission (last step answered)
```ts
async function handleSubmit() {
  setIsSubmitting(true);
  // 1. Ensure userId exists
  const userId = await ensureSession(); // calls getOrCreateAnonymousUser if needed
  // 2. Build persona from answers
  const persona = buildPersonaFromAnswers(personaStore.rawAnswers);
  // 3. Save to DB (server action)
  const { sessionId, profileId } = await submitQuiz(userId, persona, personaStore.rawAnswers);
  // 4. Update stores
  personaStore.setSessionId(sessionId);
  personaStore.setProfileId(profileId);
  personaStore.markComplete();
  // 5. Redirect
  router.push(`/shortlist?session=${sessionId}`);
}
```

### Components

#### `QuizStep`
`components/quiz/QuizStep.tsx`
```tsx
Props: { question: QuizQuestion; selectedValues: string[]; onAnswer: (v: string | string[]) => void }
```
- Renders the question headline + optional context note (grey italic, "Why we ask this")
- Renders a grid of `AnswerCard` components
- For `multi: true` questions (Q5): tracks selections, shows "Continue →" button

#### `AnswerCard`
`components/quiz/AnswerCard.tsx`
```tsx
Props: { option: AnswerOption; selected: boolean; onSelect: () => void }
```
- Full-width card with label + sublabel
- `motion.div` with `whileTap={{ scale: 0.97 }}`
- Selected state: `ring-2 ring-navy-500 bg-navy-50`

#### `ContradictionNudge`
`components/quiz/ContradictionNudge.tsx`
```tsx
Props: { contradiction: Contradiction; onContinue: () => void }
```
- Amber background, warm tone — not a blocking error
- Shows `contradiction.message` + optional `contradiction.suggestion`
- "Continue anyway →" button to proceed

#### `QuizProgress`
`components/quiz/QuizProgress.tsx`
```tsx
Props: { current: number; total: number }
```
- Uses `ProgressBar` component
- Label: "Question {current} of {total}"

### Shortlist Page
`app/shortlist/page.tsx` — **Client Component**

```tsx
const { session } = useSearchParams();  // await searchParams from props
// On mount: call getShortlistForSession(sessionId) server action
// Render persona banner at top
// Render CarCard grid (4–8 results)
```

**Persona banner:**
```tsx
<div className="bg-navy-50 rounded-xl p-4 flex justify-between items-center">
  <p className="text-sm text-navy-800">
    "You're looking for a {familySizeLabel} {useCaseLabel} car, budget up to ₹{budgetLabel}."
  </p>
  <Link href="/quiz" className="text-xs text-navy-600">Edit answers →</Link>
</div>
```

**Empty state:** If no matches after filtering, show: "We couldn't find cars that match all your criteria. Try adjusting your budget or safety preference."

---

## Feature 3 — Side-by-Side Comparison

### Isolation Contract

| | |
|--|--|
| **Owns** | `app/compare/page.tsx` · `app/compare/share/[token]/page.tsx` · `components/comparison/*` |
| **Store reads** | `useCompareStore` (carIds, addCar, removeCar) · persona via `useActivePersona()` only |
| **Server actions** | `createComparison()` · `getComparisonByToken()` from `lib/comparison.ts` · `getVariantsByIds()` from `lib/cars.ts` |
| **Layout** | Replace `<CompareBarSlot />` with `<CompareBar />` — the only change to `app/layout.tsx` |
| **Persona rule** | Use `useActivePersona()` and `personaFromBuyerProfile()` from `lib/persona-helpers.ts`. Never import `store/persona.ts`. |
| **Never touches** | `lib/quiz.ts` · `store/persona.ts` · `components/quiz/*` · `components/tco/*` |

```ts
// Getting persona in compare/page.tsx
import { useActivePersona, formatPersonaSummary } from "@/lib/persona-helpers";
const { persona, hasQuizPersona } = useActivePersona();

// Getting persona in compare/share/[token]/page.tsx (Server Component)
import { personaFromBuyerProfile } from "@/lib/persona-helpers";
const persona = comparison.buyerProfile ? personaFromBuyerProfile(comparison.buyerProfile) : null;

// Share button — correct imports
import { useSessionStore } from "@/store/session";
import { usePersonaStore } from "@/store/persona";  // only for profileId read
const userId = useSessionStore(s => s.userId);
const profileId = usePersonaStore(s => s.profileId);  // read-only; never call write methods
```

### Routes
- `app/compare/page.tsx` — **Client Component** — live comparison from `useCompareStore`
- `app/compare/share/[token]/page.tsx` — **Server Component** — read-only shared view

### Persistent Compare Bar
`components/comparison/CompareBar.tsx` — **Client Component**  
Added as a leaf in `app/layout.tsx`.

```tsx
const { carIds, removeCar, clearAll } = useCompareStore();
if (carIds.length === 0) return null;
```

Visual structure:
```
[fixed bottom bar, z-50]
  [car chips with × remove]
  [spacer]
  [disabled hint if < 2 cars]
  [Compare now → button]
```

### Comparison Page (`app/compare/page.tsx`)

**Data loading:**
```tsx
// On mount:
const variants = await getVariantsByIds(compareStore.carIds);  // server action
const profile = /* personaStore persona or null */;
```

**Persona Banner:**
`components/comparison/PersonaBanner.tsx`  
Shows the active persona and an "Edit" button that opens a lightweight inline edit form (changes update the local persona used for verdict generation — does NOT save to DB on edit, only updates in-memory for the current comparison view).

**Section ordering:** If `profile.safetyPriority === true`, the Safety section is rendered first before Pricing. Otherwise order is: Pricing → Performance → Efficiency → Space → Safety → Ownership.

**Overall Verdict Card:**
`components/comparison/VerdictCard.tsx` — sticky at top (CSS `position: sticky; top: 0`)
```tsx
const verdict = overallVerdict(variants, profile);
// If verdict.winnerId: show winner name in green badge
// Else: show "genuinely close" framing
```

**Comparison Table Structure:**
Each section is a `CollapsibleSection` (extends `Collapsible`) that also renders a `SectionVerdict`.

```
Section: Pricing
  SectionVerdict (one-liner)
  SpecRow: Ex-showroom price
  SpecRow: On-road estimate
  SpecRow: EMI at 8.5% / 60 months  [highlight winner]

Section: Real-World Performance
  SectionVerdict
  SpecRow: Engine / power (contextual label)
  SpecRow: Torque (hidden if all values within 10%)
  SpecRow: Transmission + use-case note

Section: Efficiency & Running Cost
  SectionVerdict
  SpecRow: Certified mileage + "Expect 10–15% less in city traffic"
  SpecRow: Est. monthly fuel cost (uses profile.annualKm ÷ 12 × fuel price)
  SpecRow: Tank / range in km equivalent

Section: Space & Practicality
  SectionVerdict
  SpecRow: Boot space (litres + suitcase equivalent)
  SpecRow: Ground clearance (threshold label)
  SpecRow: Turning radius (label: "Easy to park" / "Needs more space")

Section: Safety
  SectionVerdict
  SpecRow: NCAP rating (stars + note)
  SpecRow: Airbags count
  SpecRow: Key safety features (from featuresList)

Section: Ownership Experience
  SectionVerdict
  SpecRow: Service interval + annual cost estimate
  SpecRow: Service network (from make.serviceNetworkTier)
```

**SpecRow component:**
`components/comparison/SpecRow.tsx`
```tsx
Props: {
  label: string;
  values: (string | number | null)[];
  winnerIndex?: number;
  callout?: string;  // "Does this matter for you?" note
  unit?: string;
}
```
- On mobile: car names frozen in leftmost column, table scrolls horizontally
- "Show only differences" toggle: row is hidden if all non-null values are within 5% of each other (or identical for strings)

**Share button flow:**
```tsx
// Correct imports for compare/page.tsx
import { useActivePersona } from "@/lib/persona-helpers";
import { useSessionStore } from "@/store/session";
import { usePersonaStore } from "@/store/persona";  // read profileId only

const { persona } = useActivePersona();
const userId = useSessionStore(s => s.userId);
const profileId = usePersonaStore(s => s.profileId);  // read-only; never call write methods

async function handleShare() {
  const { shareToken } = await createComparison(
    compareStore.carIds, persona, userId, profileId
  );
  const url = `${window.location.origin}/compare/share/${shareToken}`;
  await navigator.clipboard.writeText(url);
  setShareCopied(true);
}
```

### Shared Comparison Page (`app/compare/share/[token]/page.tsx`)
Server Component — fetches via `getComparisonByToken(token)`.  
Renders the same comparison UI but:
- `PersonaBanner` is read-only (no edit button)
- No `CompareBar` actions
- "Save to my comparisons" CTA (deferred; for Phase 2)

---

## Feature 5 — TCO Calculator

### Isolation Contract

| | |
|--|--|
| **Owns** | `app/tco/page.tsx` · `components/tco/*` |
| **No store writes** | Read-only — never writes to any store |
| **Server actions** | `getVariantsByIds()` / `getVariantById()` from `lib/cars.ts` — one call on mount only |
| **Calculation** | `calculateTCO()` from `lib/tco.ts` runs in `useMemo` client-side — no server round-trip |
| **Persona rule** | Use `useActivePersona()` from `lib/persona-helpers.ts`. If `hasQuizPersona === false`, show "Using defaults — take the quiz for personalised figures" and pre-fill with `DEFAULT_PERSONA`. |
| **Layout** | No changes |
| **Never touches** | `lib/quiz.ts` · `lib/comparison.ts` · `store/persona.ts` · `components/quiz/*` · `components/comparison/*` |

```ts
// Pre-fill in tco/page.tsx — correct pattern
import { useActivePersona, DEFAULT_PERSONA } from "@/lib/persona-helpers";
import { getFuelPrice } from "@/lib/fuel-prices";

const { persona, hasQuizPersona } = useActivePersona();

const [input, setInput] = useState<TCOFormState>({
  onRoadPrice: variant?.priceOnroadEstimate ?? 0,
  downPayment: Math.round((persona.budgetMax ?? DEFAULT_PERSONA.budgetMax) * 0.20),
  loanTenureMonths: 60,
  interestRate: 8.5,
  annualKm: persona.annualKm,
  ownershipYears: 5,
  fuelPrice: getFuelPrice("Delhi", variant?.fuelType ?? "PETROL"),
  electricityTariff: 8,
});
```

### Route
`app/tco/page.tsx` — **Client Component**

**Entry points & URL params:**
- `/tco?carId=<variantId>` — single car mode
- `/tco?carIds=<id1>,<id2>,<id3>` — comparison mode (up to 3 cars)
- `/tco` — car picker shown first

### Pre-fill Logic
On mount, read persona via `useActivePersona()` (not `usePersonaStore` directly):
```ts
const { persona, hasQuizPersona } = useActivePersona();
// persona is always defined (falls back to DEFAULT_PERSONA when no quiz taken)
// Show "Pre-filled from your profile" banner only when hasQuizPersona === true
```
Show confirmation banner when `hasQuizPersona`: "Pre-filled from your profile — adjust anything."  
Show default banner when `!hasQuizPersona`: "Using defaults — take the quiz for personalised figures."

### Input State
```ts
interface TCOFormState {
  onRoadPrice: number;    // from variant, editable
  downPayment: number;    // default 20%
  loanTenureMonths: number; // default 60
  interestRate: number;   // default 8.5
  annualKm: number;       // from persona
  ownershipYears: number; // default 5
  fuelPrice: number;      // from FUEL_PRICES[persona.city]
  electricityTariff: number; // default 8 ₹/kWh
}
```

**Core inputs (always visible):** on-road price, down payment, loan tenure, annual km, ownership years.  
**Fine-tune (Collapsible):** interest rate, fuel price, electricity tariff.

### Calculation Trigger
`calculateTCO()` from `lib/tco.ts` is called in a `useMemo` whenever any input changes. No server round-trip needed — pure client-side calculation.

### Layout (top to bottom)

1. **TCO Verdict Card** (`components/tco/TCOVerdictCard.tsx`)
   ```tsx
   // Single car: "This car will cost you ~₹X/month net over 5 years."
   // Multi car: "Baleno is ₹2.1L cheaper to own over 5 years — here's why."
   ```

2. **Metric Cards row** (4 cards):
   - Total spend | Net after resale | Avg monthly cost | Monthly EMI

3. **Cost Breakdown Chart** (`components/tco/CostBreakdownChart.tsx`)
   - `recharts` `BarChart` horizontal stacked bar per car
   - Segments: Loan (navy) · Fuel (amber) · Insurance (blue-gray) · Service (green) · Tyres (gray)
   - Tooltip shows rupee amount per segment on hover

4. **Year-by-Year Chart** (`components/tco/YearByYearChart.tsx`)
   - `recharts` `LineChart` — one line per car
   - X axis: years 1–5 | Y axis: cumulative cost (INR)
   - If crossover point exists (diesel becomes cheaper than petrol), annotate with a vertical dashed line and label: "Diesel cheaper from year 3"
   - Annotation logic: `yearByYear[n].cumulativeCost` of car A < car B

5. **Inputs section** — core always visible, fine-tune in `Collapsible`
   - Each input uses `InputGroup` component
   - Inline `ScenarioNudge` appears next to relevant inputs

6. **Scenario Nudges** (`components/tco/ScenarioNudge.tsx`)
   - Amber card with icon, inline below relevant input or chart section
   - Triggered by `getScenarioNudges(input, variant.fuelType)` from `lib/tco.ts`

### Components Detail

#### `InputGroup`
`components/tco/InputGroup.tsx`
```tsx
Props: {
  label: string;         // "How much you're paying upfront"
  techLabel?: string;    // "Down payment" (shown smaller above)
  value: number;
  onChange: (v: number) => void;
  prefix?: string;       // "₹"
  suffix?: string;       // "months" / "km/year"
  min?: number; max?: number;
  defaultValue?: number;
  onReset?: () => void;
}
```
- Shows "Reset to profile" link when value differs from profile default

#### `TCOVerdictCard`
```tsx
Props: { results: { variant: VariantWithModel; tco: TCOResult }[]; persona: BuyerPersona | null }
```
- Single car: narrative sentence about monthly net cost and what that translates to
- Multi car: compare net costs, name cheaper car, give persona-relevant reason (diesel/km comment if applicable)

#### `CostBreakdownChart`
```tsx
Props: { results: { label: string; breakdown: TCOBreakdown }[] }
```
- Uses `recharts` `BarChart` with `layout="vertical"` for horizontal bars
- Each bar is a `Bar` per category, `stackId="cost"`
- `ResponsiveContainer` width="100%" height={80 per car}

#### `YearByYearChart`
```tsx
Props: { yearlyData: { label: string; snapshots: YearlySnapshot[] }[] }
```
- Uses `recharts` `LineChart`
- Each car is a `Line` with a unique colour
- Data key: `netCost` (cumulative cost minus resale at that year)
- `ReferenceLine` at crossover year if applicable

---

## Routing Summary

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Server | Landing page, quiz CTA |
| `/quiz` | Client | Multi-step preference quiz |
| `/shortlist?session=<id>` | Client | Quiz results — ranked car cards |
| `/compare` | Client | Live side-by-side comparison |
| `/compare/share/[token]` | Server | Shared read-only comparison |
| `/tco?carId=<id>` | Client | TCO calculator (single car) |
| `/tco?carIds=<a,b>` | Client | TCO calculator (comparison mode) |

---

## Key UX Rules

1. **Contradiction nudges** are always informational — never block progression. They appear below the answer cards.
2. **Match reasons** on `CarCard` are always persona-specific, generated by `generateMatchReason()` in `lib/scoring.ts`.
3. **Missing data** in comparison rows: show "–" with tooltip "We don't have verified data for this yet." Never blank cells.
4. **Mobile**: car names sticky in left column of comparison table; table scrolls horizontally.
5. **Toast** for "4 cars already" limit: `"You've got 4 already — remove one to add this."` (auto-dismisses in 3s).
6. **Pre-fill banners** in TCO: only show if persona has at least `annualKm` set (quiz completed).
