# PRD: Maintenance Rules & Scheduling

**Area owner:** Product + Engineering
**Related tables:** `custom_rules` (today); recommended future `rule_templates` / `property_rules` (see Open Questions)
**Status:** Built as a hardcoded `RULES` catalog (~45 entries) in `index.html`; custom per-property overrides exist; due-date math is working

---

## Problem Statement

Preventive maintenance has no natural trigger — nothing *tells* an owner the HVAC filter is due in the way a guest checkout triggers a cleaning. Owners either track dozens of calendar-driven tasks manually (and miss things) or don't track them at all until something fails expensively. This is the single feature that makes PropertyPulse different from a generic task list: a catalog of maintenance knowledge (what needs doing, how often, and why) that automatically matches itself to whatever a property has, and computes what's due from real completion history rather than a fixed calendar.

## Goals

1. Every property with systems/appliances recorded gets a non-empty, correct maintenance schedule with zero manual rule-building.
2. Due dates are always computed from the last real completion (or baseline date if never completed) — never silently wrong or stale.
3. Owners in harsh or unusual climates can override the default interval per property without losing the original rule or affecting other properties.
4. The catalog itself (rule name, interval, trade, reasoning) is maintainable without a code deploy for every change — see Open Questions on where it should ultimately live.

## Non-Goals

- **User-authored rules from scratch with no catalog match** — supported today via custom rules, but not the primary path; most value comes from the built-in catalog, not owners inventing their own rule taxonomy.
- **Automatic interval tuning from usage data or weather APIs** — a real idea (e.g., auto-adjusting mini-split filter intervals based on local humidity), but not in scope until the catalog itself is in a table, not code.
- **Task dependencies or sequencing** (e.g., "can't close the pool until it's been chemically balanced") — the catalog is a flat list of independent rules today.
- **Booking-calendar-aware scheduling** ("don't schedule HVAC service during a stay") — valuable, deferred; see `OPENSTR-COMPARISON.md` notes on iCal integration.

## User Stories

- As any owner, I want the schedule to populate automatically based on what I told the app my property has, so I never have to build a maintenance plan myself.
- As an owner in a harsh climate (salt air, humidity, freeze-thaw), I want to override a rule's interval for just one property, so the schedule reflects my actual conditions instead of generic manufacturer defaults.
- As any owner, I want to see *why* a task matters (not just that it's due), so I understand the cost of skipping it and can prioritize when time or budget is tight.
- As any owner, I want to add a rule the catalog doesn't cover (something specific to my property), so nothing important falls outside the system.
- As any owner, I want to permanently retire a rule that no longer applies (e.g., I removed the pool) without losing the history of work already logged against it.
- As a multi-property owner, I want to see what's overdue across *all* my properties in one place, not property by property, so I can prioritize my week.

## Requirements

### Must-Have (P0)
- **Automatic rule matching**: when a property records a system/appliance, every catalog rule whose `req` matches gets attached to that property's schedule.
  - *Acceptance:* adding "mini-split" to a property immediately surfaces the mini-split filter rule (every 2 months) without any other action.
- **Due-date computation**: `last completion date + interval`, or `baseline date + interval` if never completed.
  - *Acceptance:* logging a completion recalculates the next due date correctly; a never-completed rule is due at baseline + interval, not "immediately."
- **Per-property custom rules**: name, interval (months), trade, reasoning — same treatment as catalog rules in the schedule and due-date logic.
  - *Acceptance:* a custom rule behaves identically to a catalog rule everywhere it appears (dashboard, overdue list, vendor suggestion).
- **Skip/not-applicable override**: an owner can mark a matched catalog rule as not applicable to their specific property (e.g., has a chimney but never uses it) without deleting data.
  - *Acceptance:* a skipped rule disappears from the active schedule but the skip is reversible.
- **Overdue vs. upcoming distinction**: clear visual/status difference between "due soon" and "overdue."
  - *Acceptance:* a rule past its due date is unambiguously flagged as overdue, sorted to the top of relevant views.

### Nice-to-Have (P1)
- **Per-property interval override**: change a catalog rule's interval for one property without creating a duplicate custom rule (the Cabarete salt-air case — mini-split filters every 2 months generically, but an owner may want every 6 weeks at one coastal unit).
- **Seasonal awareness surfaced in UI**: the catalog already has a `season` field (e.g., gutter cleaning in spring vs. fall) — expose this so tasks appear with seasonal context, not just a raw due date.
- **Cross-property overdue rollup**: a single view listing every overdue task across all of an owner's properties, sorted by urgency.

### Future Considerations (P2)
- Move the rule catalog from hardcoded `RULES` array into a database table (`rule_templates`), enabling per-property rule edits without a code deploy and laying groundwork for interval overrides (P1 above). See `OPENSTR-COMPARISON.md` for a proposed schema shape.
- Booking-calendar-aware scheduling once `ical_url` / `reservations` exist (see Accounts/Properties roadmap).
- Rule dependencies/sequencing.

## Success Metrics

**Leading indicators**
- % of properties with zero "unmatched" systems (every selected system produces at least one rule) — target: 100%, this should never fail silently.
- Average number of overdue tasks per active property over time (target: trending down after 90 days of use — the product is working if backlogs shrink).
- % of custom rules created vs. catalog rules used (a high ratio suggests catalog gaps worth filling).

**Lagging indicators**
- Correlation between "tasks completed on schedule" and reduced emergency repair costs (requires Completions cost data — see that PRD). This is the metric that ultimately proves the product's value proposition.
- Retention of owners who have 10+ logged completions vs. those who have fewer than 3 (does using the schedule predict staying?).

## Open Questions

- Should the rule catalog move out of code and into a `rule_templates` table now, or after the database migration is stable? (Engineering — doing it now avoids a second migration later, but adds scope to an already-large Step 3.)
- Who decides new catalog entries over time — is this a product/content function, or does it stay engineering-only? (Product — matters once this becomes a multi-tenant product rather than one owner's tool.)
- What's the right default interval source for climate-sensitive rules — do we ship regional presets (e.g., "coastal" vs. "temperate") instead of relying on every owner to manually override? (Product/Design — directly affects the override UX in P1.)

## Timeline Considerations

- **Dependency:** Requires Properties & Appliances to be live first (rules match against recorded systems).
- **Dependency:** Completions & Service History must be wired in parallel — due-date math is meaningless without real completion data feeding it.
- **Phasing:** P0 is already functionally complete in the prototype; the real timeline risk is the database migration (Step 3), not new feature work.
