# Car Research Platform — Phase 1 MVP Feature Specifications

**Version:** 2.0  
**Phase:** MVP  
**Features in scope:** Guided Preference Quiz · Side-by-Side Comparison · Total Cost of Ownership Calculator

---

## Design Philosophy — The Enthusiast Friend

This platform does not behave like a database with filters. It behaves like a knowledgeable friend who happens to know everything about cars — someone who listens to how you actually live, asks the right follow-up questions, and then says *"honestly, for your situation, go with this one."*

Every feature must pass this test: **would a real car enthusiast friend say it this way?**

That means:
- No jargon unless it matters. A buyer doesn't need to know "displacement in cc" — they need to know if the car feels responsive in traffic.
- Opinions are not hidden behind data. The platform draws a conclusion and explains why.
- The buyer's specific context — their family size, commute, budget anxiety, safety concerns — follows them through every screen and shapes every recommendation.
- Contradictions are called out kindly, not silently ignored.

---

## Feature 2 — Guided Preference Quiz

### Purpose

Replace the blank search bar with a short, friendly conversation that figures out what the buyer actually needs — not what spec sheet they think they want. The output is a shortlist that feels handpicked, not filtered.

### Tone & Interaction Principles

Questions are written the way a friend would ask them — in plain, situational language. There are no dropdowns, no sliders on the first pass, no clinical multi-select lists. Each screen has one question, a short set of tappable answer cards, and optionally a warm one-line context note that explains why the platform is asking.

**Example of the wrong way:**  
*"Select fuel type: Petrol / Diesel / CNG / EV / Hybrid"*

**Example of the right way:**  
*"How far do you drive on a typical day?"*  
→ Short city trips (under 30 km) · A decent daily commute (30–80 km) · Long stretches regularly (80 km+)

The platform infers fuel type recommendations from the answer — it doesn't make the buyer decide upfront what they don't yet know.

### Question Flow

The quiz has a core set of 5 questions. Follow-up questions appear conditionally based on earlier answers. The buyer always sees their progress ("2 of 5") and can skip any non-core question.

---

**Q1 — Who's this car for?**  
*"Let's start simple — who's mostly going to be in this car?"*

- Just me, mostly solo drives
- Me and a partner, occasional trips
- Family with kids — practicality matters
- Large family or I often drive a group

> *Why this is asked:* This single answer shapes seating, boot space, and whether safety ratings become a hard filter.

---

**Q2 — What's your main use?**  
*"What will this car spend most of its life doing?"*

- Daily office commute in the city
- Weekend family trips and occasional daily use
- Mix of city driving and highway runs
- Mostly highway — I cover serious distances

> *Why this is asked:* City-heavy use favours smaller, manoeuvrable cars with good mileage in stop-go traffic. Highway use shifts the priority to cruising comfort and real-world highway efficiency.

---

**Q3 — What's your honest budget?**  
*"What's the number where you'd start feeling uncomfortable? (On-road, all-in)"*

- Under ₹8 lakh
- ₹8 – 15 lakh
- ₹15 – 25 lakh
- ₹25 – 40 lakh
- Above ₹40 lakh

> *Why this is asked:* The platform asks for the on-road comfort ceiling, not the ex-showroom starting price, to avoid the common trap of buyers discovering their chosen car costs ₹2L more than listed once insurance and RTO are added.

---

**Q4 — Is safety a hard requirement?**  
*"Some buyers want the highest crash rating available. Others are happy with a solid, reliable car. Where do you stand?"*

- Safety is non-negotiable — only show me cars with strong ratings
- I'd like good safety but I'm open to trade-offs
- Not a primary concern for me right now

> *Why this is asked:* Rather than listing airbag counts (which most buyers can't interpret), this filters to NCAP-rated cars when safety is flagged as critical — without requiring the buyer to understand the rating system.

---

**Q5 — Anything you really care about?**  
*"Last one — any of these matter to you? Pick as many as you like, or skip."*

- Great mileage / low running cost
- Spacious boot (I travel with a lot of luggage)
- Premium feel inside the cabin
- Easy to park and manoeuvre in tight spaces
- Good resale value
- I want something fun to drive

> *Why this is asked:* These act as soft boosters in the ranking — a car that ticks 3 of these ranks above one that ticks 0, even at the same price and category match.

---

### Conditional Follow-ups

| Trigger | Follow-up question |
|---------|--------------------|
| Q1 = "Family with kids" or "Large family" | *"How old are the kids? Young children change what matters in a car."* → Toddlers/young kids · School-age · Mostly grown up. Toddler answer bumps child safety lock features and rear legroom weighting. |
| Q2 = "Daily city commute" | *"Do you have a parking spot at home, or is street parking your reality?"* → Tight parking boosts compact body style ranking. |
| Q2 = "Mostly highway" | *"Any long road trips, or is it more of a straight-line daily highway run?"* → Road trip answer adds boot space and comfort seat weighting. |
| Q3 = Under ₹8L + Q1 = Large family | Friendly contradiction nudge: *"A large family and a sub-₹8L budget is a tough combination — the best options in that range seat 5 comfortably, but space is snug. Want me to show what's possible, or adjust your budget slightly?"* |

### Contradiction Nudges

When a buyer's answers conflict, the platform surfaces it conversationally — never as a validation error — and offers a path forward rather than blocking progress.

Examples of contradictions and how the platform handles them:

- **Large family + sub-₹8L budget:** *"Honest heads up — in this budget, 5-seaters exist but rear legroom is tight. I'll show you the best options, but you might want to stretch to ₹10L for real comfort."*
- **Daily highway driver + "easy to park" preference:** *"You'll be doing mostly highway driving — parking agility matters less there. Should I still factor it in, or focus on highway comfort instead?"*
- **Safety = non-negotiable + budget below cars with strong NCAP ratings:** *"At this budget, strong NCAP-rated cars are limited. I'll show the safest available, but wanted you to know upfront."*

### Shortlist Output

After the quiz, the buyer sees a results page with 4–8 cars ranked by match score. Each card shows:

- Car image, name, and variant
- A match score badge (e.g., "94% match for your profile")
- A **single, specific reason** tailored to their answers — not generic copy

**Example reasons (not generic, always persona-driven):**
- *"Perfect for your family commute — 5-star NCAP rated, excellent city mileage, and the boot handles a pram easily."*
- *"Best highway cruiser in your budget — relaxed at 120 km/h with an efficient diesel that suits your long daily drives."*
- *"Ideal if parking is a daily battle — tight turning radius and great rear camera make it stress-free in the city."*

The shortlist page also shows a subtle persona summary at the top — a one-liner that reflects back what the platform understood: *"You're looking for a safe family hatchback for city use, with a budget up to ₹14L on-road."* The buyer can tap this to edit any answer.

### Data Dependencies

`make`, `model`, `variant`, `price_onroad_estimate`, `seating_capacity`, `body_type`, `fuel_type`, `mileage_kmpl`, `range_km`, `ncap_rating`, `boot_space_litres`, `turning_radius_m`, `features_list`, `use_case_tags`, `ground_clearance_mm`

---

## Feature 3 — Side-by-Side Comparison Tool

### Purpose

Once the buyer has a shortlist, the comparison tool helps them make the final call. But rather than dumping a spec table on them, it acts like a friend who's looked at both cars and says *"here's what actually matters between these two for someone like you."*

The raw specs are all there — but they are always interpreted, not just listed.

### Accessing the Tool

- An "Add to compare" button appears on every car card throughout the platform.
- A persistent compare bar at the bottom of the screen shows selected cars (up to 4) and a "Compare" CTA.
- The comparison view remembers the buyer's quiz persona and uses it to shape which rows are surfaced first and who wins each category.

### The Persona Banner

At the top of every comparison, a persona banner reminds the buyer (and the platform's logic) what profile is being used to interpret the comparison:

> *"Comparing for: Family of 4 · Daily city commute · Budget up to ₹18L · Safety is a priority"*

This can be edited inline. Every verdict and highlight in the table updates accordingly.

### Comparison Structure

The table is organised into collapsible sections. Each section has a **section verdict** — a one-line plain-language summary of which car wins in that category *for this buyer*, and why.

---

**Pricing**

| Row | Notes |
|-----|-------|
| Ex-showroom price | |
| On-road price (estimated, city-specific) | |
| EMI estimate | At 8.5% for 60 months, shown as ₹/month |

*Section verdict example:* *"The Swift is ₹1.2L cheaper on-road. For a city buyer on a tight budget, that gap matters."*

---

**Real-World Performance** *(labelled this way, not "Engine specs")*

| Row | Plain-language framing |
|-----|----------------------|
| Engine / Battery | Shown as a usable descriptor: "1.2L naturally aspirated petrol" not raw cc |
| Power | Shown as bhp with a brief context note: "adequate for city" / "punchy for highway" |
| Torque | Only shown if meaningfully different; otherwise collapsed |
| Transmission | Manual / AMT / CVT / DCT — with a one-liner on what it means for the buyer's use case |

*Section verdict example:* *"Both feel similar in city traffic. The Nexon's turbo gives it an edge if you occasionally take it on the highway."*

---

**Efficiency & Running Cost** *(not "Mileage")*

| Row | Plain-language framing |
|-----|----------------------|
| Certified mileage / range | ARAI figure with a real-world note: "Expect 10–15% less in city traffic" |
| Estimated monthly fuel cost | Calculated using buyer's stated commute distance and current city fuel price |
| Fuel tank / Battery size | Shown as "range between fill-ups" in km, not litres/kWh |

*Section verdict example:* *"The Baleno saves roughly ₹900/month in fuel on your commute. Over 3 years that's ₹32,000."*

---

**Space & Practicality**

| Row | Plain-language framing |
|-----|----------------------|
| Rear legroom | "Comfortable for adults" / "Tight for tall passengers" based on dataset tagging |
| Boot space | Shown in litres with a real-world reference: "fits 2 large suitcases + 1 cabin bag" |
| Ground clearance | "Handles most potholes" / "May scrape on steep driveways" threshold-based label |
| Child seat anchors | Yes / No — surfaced prominently when buyer profile includes young kids |

*Section verdict example:* *"The Creta has noticeably more rear space — important if your kids are in car seats."*

---

**Safety**

| Row | Plain-language framing |
|-----|----------------------|
| NCAP rating | Shown as stars with a plain note: "tested in a frontal + side crash scenario" |
| Airbags | Count + placement — "6 airbags including curtain" not just "6 airbags" |
| Key active safety features | ABS, ESP, ADAS — with a brief note on what each does in real situations |

*Section verdict example:* *"The Tata Nexon is the only 5-star rated car in this comparison. If safety is your top priority, this is the clear winner."*

> When the buyer has flagged safety as non-negotiable in the quiz, the Safety section is automatically surfaced first, ahead of Pricing.

---

**Ownership Experience**

| Row | Notes |
|-----|-------|
| Warranty | Shown as years + km, whichever runs out first |
| Service interval | In km, with an estimated annual service cost |
| Brand service network | "Wide network" / "Limited in smaller cities" based on dealer density data |

*Section verdict example:* *"Maruti's service network is unmatched — useful if you ever travel to Tier-2 cities."*

---

### Spec Row Verdicts

Beyond section-level verdicts, individual rows can carry a **"Does this matter for you?"** callout when the difference is commonly misunderstood:

- *"The torque difference of 20 Nm won't be noticeable in daily city driving."*
- *"Ground clearance of 165mm vs 180mm — the gap matters more if you live near unmaintained roads."*
- *"Both have AMT gearboxes, but these come from different suppliers — owner reviews suggest one is noticeably smoother."*

These callouts are data-editorially maintained and only shown for rows where the spec difference is large enough to flag or the spec is a common source of buyer confusion.

### Overall Verdict Card

At the top of the comparison (and pinned as a sticky summary while scrolling), a verdict card names a winner for the buyer's specific use case:

> **For your profile: Best pick is the Tata Nexon XM (S)**  
> *"5-star safety rating, enough boot space for a family of 4, and within your budget on-road. The Swift costs less but gives up on safety ratings and rear space — meaningful trade-offs for a family buyer."*

If no single winner is clear (e.g., both cars are strong in different dimensions), the card says so honestly and frames the decision:

> *"These two are genuinely close for your use case. Choose the Baleno if monthly running cost is the priority. Choose the Altroz if you want a more premium cabin feel."*

### Shareable Comparison

Each comparison generates a unique shareable URL that preserves the buyer's persona context, so when a family member opens it, they see the same verdicts and the same use-case framing.

### Edge Cases & Rules

- If a spec is missing from the dataset, the row shows "–" with a note: *"We don't have verified data for this yet."* No blank cells.
- On mobile, car names are frozen in the leftmost column; the table scrolls horizontally.
- A "Show only differences" toggle collapses rows where all compared cars have identical or near-identical values.
- Maximum 4 cars in one comparison. Adding a 5th prompts: *"You've got 4 already — remove one to add this?"*

### Data Dependencies

`make`, `model`, `variant`, `price_exshowroom`, `price_onroad_estimate`, `engine_description`, `power_bhp`, `torque_nm`, `transmission_type`, `mileage_kmpl`, `range_km`, `fuel_tank_litres`, `battery_kwh`, `rear_legroom_tag`, `boot_space_litres`, `ground_clearance_mm`, `child_seat_anchors`, `ncap_rating`, `airbag_count`, `airbag_placement`, `adas_features`, `warranty_years`, `warranty_km`, `service_interval_km`, `service_cost_estimate`, `dealer_network_tier`

---

## Feature 5 — Total Cost of Ownership (TCO) Calculator

### Purpose

Most buyers compare sticker prices and pick the cheaper car — then feel surprised when the "cheaper" car costs more to run over three years. The TCO calculator exists to tell the full financial truth, and more importantly, to tell it in a way that's personal to this buyer's situation and leads to a clear recommendation — not just a table of numbers.

### Entry Points

- Accessible from any car detail page as "What will this really cost me?"
- Accessible from the comparison tool as "Compare total cost over 5 years"
- When accessed from comparison, all cars are shown side by side using the same inputs.

### Buyer Context Pre-fill

The calculator pre-fills from the buyer's quiz answers wherever possible:

- Annual km from commute answer (city = 15,000 km default · highway = 25,000 km default)
- City from location (for on-road pricing and fuel price defaults)
- Budget from quiz (used to calibrate loan assumptions)

The buyer sees a brief confirmation at the top: *"We've pre-filled this based on your profile. Adjust anything that doesn't fit."*

### Inputs

All inputs are shown with plain-language labels and sensible defaults. The layout prioritises the inputs that have the most impact on the final number — less-impactful inputs (like exact interest rate) are in a collapsible "Fine-tune" section to avoid overwhelming first-time users.

**Core inputs (always visible)**

| Input | Default | Label shown to buyer |
|-------|---------|----------------------|
| On-road purchase price | Pre-filled from dataset + city | "What you'll actually pay to drive it home" |
| Down payment | 20% | "How much you're paying upfront" |
| Loan tenure | 60 months | "How many months to pay it off" |
| Annual km driven | From quiz profile | "How much you drive in a year" |
| How long you'll keep it | 5 years | "When do you plan to sell or upgrade?" |

**Fine-tune inputs (collapsible)**

| Input | Default |
|-------|---------|
| Interest rate | 8.5% p.a. |
| Fuel price | City average (auto-updated) |
| Electricity tariff (EVs only) | ₹8/kWh |
| Insurance type | Comprehensive |

### Cost Components Calculated

**What you pay upfront**
- On-road price (ex-showroom + RTO + insurance year 1 + accessories estimate)
- Down payment deducted → loan amount derived

**What you pay monthly**
- EMI (loan repayment)
- Fuel / charging cost (mileage × km driven × fuel price)
- Insurance renewal from year 2 (depreciation-adjusted)

**What you pay periodically**
- Scheduled servicing (average service cost × frequency based on km)
- Tyres (pro-rated replacement based on ownership period)

**What you get back**
- Estimated resale value at end of ownership period  
  *(depreciation model: ~15% year 1, ~10% per year thereafter, adjusted by brand and segment reliability scores)*

### Output: The Verdict First, Numbers Second

The calculator does not open with a table. It opens with a verdict — a plain-language conclusion shaped by the buyer's profile.

**Verdict card (shown at top)**

> **Over 5 years, the Tata Nexon will cost you ₹6.8L more than the Maruti Baleno — but here's why that might still be the right call for you.**  
> *"You flagged safety as a priority, and the Nexon is the only 5-star rated car in your shortlist. The extra cost works out to ₹1,130/month. Whether that's worth it depends on how much weight you put on safety for a family car."*

Or if one car is clearly the better financial decision:

> **The Baleno is ₹2.1L cheaper to own over 5 years on your commute profile.**  
> *"Its petrol engine suits city stop-go traffic better than the Nexon's diesel at your annual mileage. The diesel advantage only kicks in above 20,000 km/year — you're at 14,000."*

The verdict is never generic. It references the buyer's specific km profile, family situation, or safety stance where relevant.

### Numbers Breakdown (below the verdict)

**Headline numbers** (metric card row):

- Total spend over ownership period
- Net cost after resale  
- Average monthly cost (net ÷ months)  
- Your monthly EMI

**Cost breakdown chart** — a stacked bar showing how the total splits across: loan repayment · fuel · insurance · maintenance · tyres. This helps buyers see where the real cost lies and what levers they can pull.

**Year-by-year timeline** — a line chart showing cumulative cost over the ownership period, one line per car when in comparison mode. This makes the "crossover point" visible: e.g., *"The diesel becomes cheaper than petrol after year 3 at your mileage."*

### Scenario Nudges

The calculator proactively surfaces scenarios where the buyer's input assumptions lead to a financially poor outcome:

- *"At 14,000 km/year, a diesel engine won't save you money — the fuel efficiency advantage doesn't offset the higher purchase and service costs until ~20,000 km/year."*
- *"A 7-year loan on a ₹10L car means you'll be paying for it longer than it holds strong resale value. Consider 5 years or a higher down payment."*
- *"You've chosen comprehensive insurance on a 5-year loan — worth knowing that the insured value (IDV) drops each year while your premium stays relatively stable."*

These nudges appear inline, next to the relevant input or chart section, not as blocking warnings.

### Edge Cases & Rules

- Fuel prices refresh from a city-indexed table updated weekly; buyers see the "last updated" date.
- Resale value estimates are labelled *"indicative — actual resale depends on condition, colour, and market at time of sale."*
- EV charging defaults to home tariff; a "I charge mostly at public stations" toggle applies a blended ₹15–18/kWh rate.
- All inputs reset to profile defaults via a single "Reset to my profile" button.
- If a car has no resale data available, the resale estimate is omitted from the net cost figure and flagged clearly.

### Data Dependencies

`price_exshowroom`, `price_onroad_estimate`, `rto_charges_by_city`, `mileage_kmpl`, `range_km`, `fuel_type`, `service_cost_per_visit`, `service_interval_km`, `tyre_replacement_cost_estimate`, `resale_depreciation_model`, `insurance_idv_model`  
External: city fuel price table (weekly refresh) · city RTO rate table

---

## Cross-Feature Integration

These three features are not standalone tools — they are steps in a single buyer journey.

```
Quiz (F2)
  → Produces: buyer persona + ranked shortlist
      ↓
Comparison (F3)
  → Uses: buyer persona to shape verdicts and surface the right sections first
  → Produces: a clear "best pick" recommendation with reasoning
      ↓
TCO Calculator (F5)
  → Uses: buyer persona (commute km, city, budget comfort) to pre-fill inputs
  → Produces: a financial verdict that confirms or challenges the comparison recommendation
```

Specific integration touchpoints:

| From | To | How |
|------|----|-----|
| Quiz answers | Comparison | Persona banner pre-populated; safety-first buyers see safety section surfaced at top |
| Quiz answers | TCO | Annual km, city, and budget pre-fill the calculator inputs |
| Comparison | TCO | "Compare total cost" CTA opens TCO in side-by-side mode with all compared cars loaded |
| TCO verdict | Comparison | If TCO changes the recommendation, a callout appears on the comparison: *"Based on your mileage, the cheaper-to-run car is actually the Baleno — see full cost breakdown."* |

---

## Phase 2 Preview (Out of Scope for Phase 1)

The following features are deliberately deferred to avoid scope creep and to ensure Phase 1 ships as a coherent, polished experience:

- **Feature 1 — Natural language search:** Type-anything search that interprets intent ("safe SUV for a new driver under ₹15L") without requiring the quiz flow.
- **Feature 4 — AI recommendation cards:** Fully generated plain-language summaries explaining why a specific car fits a specific buyer.
- **Feature 6 — Review sentiment engine:** NLP-processed user reviews distilled into structured pros/cons by aspect category.

Phase 1 lays the persona infrastructure (quiz profile, buyer context object) that Phase 2's NLP features will build directly on top of.

---

*Document owner: Product team · Version 2.0 · June 2026*
