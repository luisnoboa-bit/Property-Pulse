# PropertyPulse — App Brief

**For:** Marketing, Product, Engineering, Design
**Status:** Living document — update as the product evolves
**Last updated:** 2026-10-26

---

## One-liner

PropertyPulse is a preventive-maintenance scheduler built for short-term rental owners — it tells you exactly what needs servicing, when, and who to call, before a guest finds the problem first.

## The problem

Short-term rental hosts manage their properties' *cleanliness* with great tooling — turnover checklists, cleaner scheduling, and inspection apps are a crowded, mature category. Nobody has solved the slower, more expensive problem sitting underneath that: **preventive maintenance.**

HVAC filters, water heater flushes, septic pumping, gutter cleaning, smoke detector batteries, pool chemistry — dozens of small, calendar-driven tasks with no natural trigger. Nothing reminds the host that a task is due; it just quietly stops happening until something breaks, a guest complains, or a repair costs ten times what the preventive version would have. Owners track this today in a spreadsheet, a notes app, or their memory — and it falls apart as soon as they own more than one unit or bring on help.

The owners who feel this hardest are **multi-property hosts** and anyone managing property in a **harsh climate** (salt air, humidity, freeze-thaw) where generic manufacturer intervals are wrong and the cost of skipping maintenance compounds fast.

## Who it's for

| Persona | Description | Primary need |
|---|---|---|
| **Solo host** | Owns 1–3 units, self-manages | A single source of truth for what's due, without spreadsheets |
| **Multi-property owner** | Owns or manages 5+ units, often across a region | Portfolio-level visibility; delegating work to vendors |
| **Vendor / contractor** | HVAC, plumbing, pool, pest techs the host hires | A simple link to see what's scheduled, no login required |
| **Guest** | Currently staying at the property | A frictionless way to report something broken, without a support ticket system |

## What it does today (the core loop)

1. **Onboard a property** — tell PropertyPulse what systems and appliances it has (HVAC type, water heater, pool, septic, etc.).
2. **Get a maintenance schedule, automatically** — a built-in catalog of ~45 maintenance rules (interval, trade, and the reasoning behind each one) matches itself to what the property actually has.
3. **See what's due, act on it** — the dashboard surfaces overdue and upcoming tasks, each pre-attached to the right vendor trade.
4. **Log completions** — cost, vendor, date, and notes, building a permanent service history per property.
5. **Document condition** — scheduled walkthroughs with photos, useful for deposits, insurance, and absentee owners.
6. **Catch guest-reported issues** — guests get a code-based link (no account) to report a problem straight into the same queue.

## What makes this different

- **Interval-driven, not turnover-driven.** Most STR tools schedule work around a guest checkout. PropertyPulse schedules work around the calendar — the maintenance clock runs whether or not anyone's staying there.
- **Cost tracking from day one.** Every completion records what it cost. Over years and multiple properties, that answers "is this unit actually profitable" and "was that vendor's quote fair" — a feature most competitors skip entirely.
- **A real appliance registry.** Brand, model, install year per appliance, so warranty and replacement-age questions have an answer.
- **Built for harsh climates.** Default intervals are a starting point, not gospel — rules can be overridden per property, because salt air or freeze-thaw changes the math.
- **No busywork to get started.** The onboarding wizard asks what the property has once, and the rule catalog does the rest — no manual checklist-building.

## Business model notes (for Marketing/positioning discussion — not yet decided)

- Natural tiering: free for a single property, paid per additional property or per portfolio.
- Vendor- and guest-facing links are a distribution surface — every walkthrough link or guest request link a non-user touches is a quiet product demo.
- A recruiter/demo account (seeded with a fictional property and history) currently serves as the portfolio-piece showcase; the same pattern is the natural "try before you sign up" flow for real prospects.

## Current scope vs. roadmap

| Area | Status |
|---|---|
| Properties & Appliances | Built, not yet on live database |
| Maintenance Rules & Scheduling | Built, not yet on live database |
| Completions & Service History | Built, not yet on live database |
| Vendor Management | Built, not yet on live database |
| Accounts & Login | Built, going live now |
| Walkthroughs & Photo Docs | Built, photos still stored locally (not cloud) |
| Guest Requests | Built, no owner notifications yet |
| Notifications (past-due digest) | Not started — see PRD |
| Booking-calendar awareness (iCal) | Not started — explored, not committed |

## Related documents

- `PRD-properties-appliances.md`
- `PRD-maintenance-rules-scheduling.md`
- `PRD-completions-service-history.md`
- `PRD-vendor-management.md`
- `PRD-walkthroughs-photos.md`
- `PRD-guest-requests.md`
- `PRD-accounts-login.md`
- `PRD-notifications-future.md`
