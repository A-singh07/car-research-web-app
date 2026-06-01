# Backend Specification — Phase 1 MVP
## Features 2 · 3 · 5: Quiz · Comparison · TCO Calculator

**Stack:** Next.js 16 Server Actions (`'use server'`) · Prisma 7 + PrismaPg adapter · PostgreSQL  
**Pattern:** All DB access through `lib/` data-access functions. No raw `prisma.*` calls in page files.

---

## Database Schema

See `prisma/schema.prisma` for the full schema. Summary:

| Table | Purpose |
|-------|---------|
| `users` | Anonymous buyers — email `anon-{uuid}@local` for MVP |
| `buyer_profiles` | Computed persona from quiz answers, linked to user |
| `makes` | Car manufacturer (includes `serviceNetworkTier`) |
| `models` | Car model (make → model) |
| `variants` | Specific trim with all spec fields |
| `ownership_costs` | 1-to-1 with variant — service, tyre, depreciation data |
| `quiz_sessions` | Raw answers + status + link to profile |
| `shortlist_results` | Persisted ranked results per session |
| `comparisons` | Shareable comparison with `shareToken` |
| `comparison_items` | Cars (variants) in a comparison (max 4) |

---

## Parallel Development Guide

The three features share read-only data access (`lib/cars.ts`, pure lib functions) but write to completely separate DB tables. No feature's server actions touch another feature's tables.

### Backend Ownership Matrix

| Feature | Writes to tables | Reads tables | Server actions file |
|---------|-----------------|--------------|---------------------|
| **F2 — Quiz** | `users` · `buyer_profiles` · `quiz_sessions` · `shortlist_results` | `variants` · `models` · `makes` · `ownership_costs` | `lib/quiz.ts` · `lib/users.ts` |
| **F3 — Comparison** | `comparisons` · `comparison_items` | `variants` · `models` · `makes` · `ownership_costs` · `buyer_profiles` *(read only)* | `lib/comparison.ts` · `lib/cars.ts` |
| **F5 — TCO** | **Nothing** — pure client-side arithmetic | `variants` · `ownership_costs` *(loaded once on mount)* | `lib/cars.ts` *(shared, read-only)* |

### Shared Read-Only Libs (all features import freely, none may modify)

| File | Type | Used by |
|------|------|---------|
| `lib/cars.ts` | Server action — DB reads | F2, F3, F5 |
| `lib/scoring.ts` | Pure function | F2 (via `lib/quiz.ts` → `lib/cars.ts`) |
| `lib/verdicts.ts` | Pure function | F3 |
| `lib/tco.ts` | Pure function | F5 |
| `lib/fuel-prices.ts` | Constants | F5 |
| `lib/rto-rates.ts` | Constants | F5 |
| `lib/persona-helpers.ts` | Client hook + pure functions | F3, F5 |

### F2-Exclusive Writes (F3 and F5 must never call)

- `saveBuyerProfile()` — writes `buyer_profiles`
- `createQuizSession()` / `updateQuizSession()` — writes `quiz_sessions`
- `saveShortlistResults()` — writes `shortlist_results`
- `submitQuiz()` — the orchestrator; called once from `app/quiz/page.tsx` on final submission

---

## Server Actions

All server actions are in `lib/` files marked `"use server"`. They are called directly from Client Components as async functions — no separate API routes needed for MVP.

### `lib/users.ts` — **F2 only**

#### `getOrCreateAnonymousUser(clientUuid: string): Promise<User>`
```
- Input: a UUID generated client-side via crypto.randomUUID()
- Action: prisma.user.upsert({ where: { email: `anon-${clientUuid}@local` }, update: {}, create: { email } })
- Returns: full User record (id is the DB UUID to store in localStorage)
```
Called once on first meaningful user action (quiz start). The returned `user.id` is persisted in `useSessionStore`.

---

### `lib/cars.ts` — **shared read-only (F2, F3, F5)**

#### `getAllActiveVariants(): Promise<VariantWithModel[]>`
```
- No input
- Query: prisma.variant.findMany({ where: { isActive: true }, include: { model: { include: { make: true } }, ownershipCost: true }, orderBy: { priceExshowroom: 'asc' } })
- Used by: getShortlistForPersona
```

#### `getVariantById(id: string): Promise<VariantWithModel | null>`
Used by TCO calculator when loading a single car.

#### `getVariantsByIds(ids: string[]): Promise<VariantWithModel[]>`
Used by comparison page to hydrate stored variant IDs.

#### `getShortlistForPersona(persona: BuyerPersona): Promise<MatchedCar[]>`
```
1. getAllActiveVariants()
2. scoreVariants(variants, persona)  ← lib/scoring.ts
3. Returns top 8 ranked MatchedCar[]
```
Called from the shortlist page on mount. Results are also persisted via `saveShortlistResults`.

---

### `lib/quiz.ts` — **F2 only**

#### `createQuizSession(userId: string | null): Promise<QuizSession>`
```
- Creates a new quiz_sessions row with status = IN_PROGRESS
- Returns session record (client stores session.id in personaStore.quizSessionId)
```

#### `updateQuizSession(sessionId, answers, profileId): Promise<QuizSession>`
```
- Sets status = COMPLETED, completedAt = now(), answers = raw JSON, profileId
```

#### `saveBuyerProfile(userId: string, persona: BuyerPersona): Promise<BuyerProfile>`
```
- Creates buyer_profiles row from computed persona
- All enum values cast to Prisma enum types
- Returns profile record (client stores profile.id in personaStore.profileId)
```

#### `saveShortlistResults(sessionId, results: MatchedCar[]): Promise<void>`
```
- Deletes any existing results for this session
- Bulk-inserts new shortlist_results rows
- Stores: sessionId, variantId, matchScore, matchReason, rank
```

#### `getShortlistForSession(sessionId: string)`
```
- Returns shortlist_results ordered by rank, with full variant + model + make + ownershipCost included
- Used by shortlist page for fast load (no re-scoring on page load)
```

#### `getSessionWithProfile(sessionId: string)`
```
- Returns quiz_sessions with buyerProfile included
- Used to reconstruct persona on shortlist page for the persona banner
```

#### `submitQuiz(userId, persona, rawAnswers): Promise<{ sessionId, profileId }>` — **F2 entry point**
```
1. saveBuyerProfile()  → buyer_profiles row
2. createQuizSession() → quiz_sessions row (IN_PROGRESS)
3. updateQuizSession() → quiz_sessions row (COMPLETED)
4. getShortlistForPersona() → scoreVariants() [pure, no DB]
5. saveShortlistResults() → shortlist_results rows
returns { sessionId, profileId }
```
This is the single server action `app/quiz/page.tsx` calls on final step submission. Already implemented in `lib/quiz.ts`.

---

### `lib/comparison.ts` — **F3 only**

#### `createComparison(variantIds, persona, userId, profileId): Promise<{ shareToken, id }>`
```
- Generates shareToken: 12-char alphanumeric random string
- prisma.comparison.create with nested comparisonItems.create (positions 1–4)
- Returns { shareToken, id }
```

#### `getComparisonByToken(shareToken: string)`
```
- prisma.comparison.findUnique({ where: { shareToken }, include: {
    comparisonItems: { orderBy: { position: 'asc' },
      include: { variant: { include: { model: { include: { make: true } }, ownershipCost: true } } }
    },
    buyerProfile: true
  }})
- Returns full comparison data for shared URL rendering
```

---

### `lib/scoring.ts` — **shared read-only, pure (no DB)**

#### `scoreVariant(variant: VariantWithModel, persona: BuyerPersona): number`
Returns 0–99 integer score. Returns 0 for hard-eliminated variants.

**Hard eliminations:**
- `priceOnroadEstimate > persona.budgetMax` → score 0
- `persona.familySize === 'LARGE_FAMILY'` AND `seatingCapacity < 7` → score 0
- `persona.safetyPriority === true` AND `ncapRating !== null` AND `ncapRating < 4` → score 0

**Soft scoring (base 50):**
| Factor | Points |
|--------|--------|
| Budget utilisation: `(1 - gap/budgetMax) × 20` | 0–20 |
| Safety bonus: `ncapRating × 4` (if safetyPriority) or `× 2` | 0–20 |
| Use-case tag match: `+5` per matching tag (max 4 matches) | 0–20 |
| Q5 preferences: `+8` each — mileage, boot, parking, premium, resale, fun | 0–48 |
| Fuel type alignment: `+10` if first-choice fuel, `+5` if secondary | 0–10 |
| Conditional boosts (kids/parking/road trips) | 0–13 |

Final score: `Math.min(99, Math.max(1, score))`.

#### `scoreVariants(variants[], persona): MatchedCar[]`
```
- Maps all variants through scoreVariant
- Filters score > 0
- Sorts descending by score
- Takes top 8
- Assigns rank 1–8
```

#### `generateMatchReason(variant, persona, score): string`
Builds a persona-specific one-liner from:
- Safety rating if safetyPriority + ncap ≥ 4
- Mileage figure if city commute + mileage > 18
- Boot space if family + boot > 300L
- Turning radius if parkingTight + radius < 5.2m
- Sunroof/premium if premium preference
- Range if EV
- Power if fun preference + > 120 bhp
- Falls back to budget fit + safety stars

Format: `"{Make} {Model} — {detail1}, {detail2}."`

---

### `lib/verdicts.ts` — **F3 only, pure (no DB)**

Functions accept `variants: VariantWithModel[]` and `persona: BuyerPersona`.

| Export | Returns |
|--------|---------|
| `pricingSectionVerdict(variants, persona)` | Which car is cheaper on-road and why it matters for this buyer |
| `safetySectionVerdict(variants, persona)` | NCAP winner with persona-aware framing |
| `efficiencySectionVerdict(variants, persona)` | Annual + 5-year fuel saving in rupees |
| `spaceSectionVerdict(variants, persona)` | Boot winner with family-awareness |
| `ownershipSectionVerdict(variants)` | Service network comparison |
| `performanceSectionVerdict(variants, persona)` | Power difference relevance for use case |
| `overallVerdict(variants, persona)` | `{ winnerId, winnerName, text }` — winner or "genuinely close" copy |

**Overall verdict logic:**
Each variant scores points across: budget fit, safety (×2 if priority), mileage fit, family space, parking, preferences. If the top score gap ≤ 5 points → "genuinely close" copy. If gap > 5 → name the winner with 2–3 supporting highlights.

---

### `lib/tco.ts` — **F5 only, pure arithmetic (no DB)**

#### `calculateTCO(input: TCOInput, ownershipCost): TCOResult`

Called client-side in `useMemo` — no server round-trip needed.

**Inputs needed from DB:** `ownershipCost` record (fetched when the variant is loaded).  
**All other inputs:** from the form state.

**Calculation steps:**
1. **EMI:** `pmt(monthlyRate, loanTenure, loanAmount)` using `decimal.js` for precision
2. **Annual fuel:** `(annualKm / mileageKmpl) × fuelPricePerLitre` (ICE) or `annualKm / rangeKm × electricityTariff` (EV)
3. **Insurance per year:**
   - Year 1: included in on-road price (skip)
   - Year 2+: `currentIDV × 0.025`, where IDV depreciates by `depreciationAnnual` each year
4. **Service per year:** `floor(annualKm / serviceIntervalKm) × serviceCostPerVisit`
5. **Tyres:** `(annualKm / 60000) × tyreReplacementCost` per year
6. **Resale at end:** `insuranceIdvEstimate × (1 - depYear1) × (1 - depAnnual)^(years-1)`
7. **Year-by-year snapshots:** cumulative total and net (after resale at that point)

**Output:**
```ts
{
  totalSpend,         // sum of all costs over ownership period
  resaleValue,        // estimated resale at end of ownership
  netAfterResale,     // totalSpend - resaleValue
  avgMonthlyCost,     // netAfterResale / (years × 12)
  monthlyEmi,
  breakdown: { loan, fuel, insurance, service, tyres },
  yearByYear: YearlySnapshot[]
}
```

#### `getScenarioNudges(input, fuelType): TCOScenarioNudge[]`
Returns array of nudge messages. Current triggers:
- `fuelType === 'DIESEL'` AND `annualKm < 20000` → diesel efficiency nudge
- `loanTenureMonths > 60` → long tenure warning
- `downPayment / onRoadPrice < 0.10` → low down payment notice

---

## Data Flow Diagrams

### Quiz → Shortlist
```
Client (quiz/page.tsx)
  → personaStore.setAnswer() [localStorage]
  → on submit: submitQuiz(userId, persona, rawAnswers) [server action]
      → saveBuyerProfile() → buyer_profiles row
      → createQuizSession() → quiz_sessions row
      → updateQuizSession() → quiz_sessions updated
      → getShortlistForPersona() → scoreVariants() [pure]
      → saveShortlistResults() → shortlist_results rows
  → router.push('/shortlist?session=<id>')

Client (shortlist/page.tsx)
  → getShortlistForSession(sessionId) [server action]
      → shortlist_results + variants + models + makes
  → render CarCard[] with matchScore + matchReason
```

### Comparison → Share
```
Client (compare/page.tsx)
  → compareStore.carIds [localStorage]
  → getVariantsByIds(ids) [server action]
  → render comparison table
  → "Share" button: createComparison(carIds, persona, userId, profileId) [server action]
      → comparisons + comparison_items rows
      → returns shareToken
  → copy link: /compare/share/{shareToken}

Server (compare/share/[token]/page.tsx)
  → getComparisonByToken(token) [direct lib call — server component]
  → render static comparison view
```

### TCO Calculation
```
Client (tco/page.tsx)
  → URL params: carId / carIds
  → getVariantsByIds(ids) [server action — one call on mount]
  → personaStore → pre-fill inputs
  → form inputs [useState]
  → useMemo: calculateTCO(input, variant.ownershipCost) [pure, client-side]
  → render charts + verdict + nudges
  [No DB writes needed for TCO]
```

---

## Error Handling

| Scenario | Handling |
|----------|---------|
| DB unreachable during server action | Action throws; Client Component shows inline error state |
| No matches from scoring | Return empty array; shortlist shows "no matches" state |
| `getComparisonByToken` returns null | Share page renders 404-style "comparison not found" |
| `getVariantsByIds` returns fewer than stored IDs | Compare page renders available cars, silently skips missing |
| `ownershipCost` is null for a variant | TCO skips service/tyre/depreciation fields, labels them "data unavailable" |

---

## Security Rules

1. **Re-validate inside every server action.** Never trust data passed from the client.
2. **No user isolation needed for MVP** — all data is anonymous. User IDs are UUIDs; there is no sensitive data to protect.
3. **Never expose internal IDs** beyond what's needed for the current operation.
4. **Quiz session and shortlist results** are read-only once written — no update/delete actions exposed.
5. **`shareToken` length (12 chars, alphanumeric)** gives ~3.5 trillion combinations — adequate for MVP but should be rate-limited in production.

---

## Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled PostgreSQL connection string (PgBouncer/Supabase pooler) |
| `DIRECT_URL` | Direct connection for `prisma migrate` only |

Set in `.env` (local dev) and deployment environment. Never prefix with `NEXT_PUBLIC_`.
