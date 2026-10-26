# PRD: Properties & Appliances

**Area owner:** Product + Engineering
**Related tables:** `properties`, `appliances`
**Status:** Core loop built in `index.html`; not yet wired to Supabase (see Step 3 of `PLAN.md`)

---

## Problem Statement

Every other feature in PropertyPulse — the maintenance schedule, vendor matching, cost history — depends on knowing what a property actually has. An owner with a mini-split and a tankless water heater needs a different schedule than one with central air and a tank heater, and the app can't generate the right schedule, or match the right vendor trade, without that inventory. Today, owners track this information (if at all) in memory, a notes app, or a spreadsheet that goes stale the moment an appliance is replaced. For multi-property owners, this problem multiplies per unit.

## Goals

1. Let an owner fully describe a property (systems, appliances, and their make/model/age) in under 10 minutes for a typical unit.
2. Make every other feature (scheduling, vendor matching) derive automatically from this inventory — zero duplicate data entry.
3. Surface incomplete appliance records (missing brand/model/year) so the data stays useful over time, not just at onboarding.
4. Support an owner managing 3+ properties without the UI becoming a scroll-fest (property switcher, per-property context everywhere).

## Non-Goals

- **Multi-user collaboration on one property** (e.g., co-host editing permissions) — out of scope for v1; revisit when Accounts & Login supports shared access.
- **Automatic appliance detection** (e.g., via smart-home integration or serial number lookup) — too complex for the value today; manual entry is fine at this scale.
- **Floor plans or room-level granularity** — PropertyPulse tracks systems and appliances, not room-by-room inventory like a home-inspection app.
- **Insurance or warranty document storage** — adjacent but separate; a future attachments feature, not this one.

## User Stories

- As a solo host, I want to answer a short set of questions about my property's systems so that I get a maintenance schedule without building one myself.
- As a multi-property owner, I want to switch between my properties quickly so that I'm never confused about which unit I'm looking at.
- As any owner, I want to record the brand, model, and install year of each appliance so that I know when something is near end-of-life or still under warranty.
- As any owner, I want to be reminded which appliances are missing details so that my records don't silently stay incomplete forever.
- As any owner, I want to add a system or appliance after initial setup (e.g., I just installed a pool) so that my schedule updates without starting over.
- As any owner, I want to mark a system as removed or not applicable so that the schedule stops nagging me about something that no longer exists.

## Requirements

### Must-Have (P0)
- **Property creation wizard**: nickname, address, property type, beds, year built, baseline date (when maintenance tracking starts), and a multi-select of systems present (HVAC type, water heater type, septic/well, pool, etc.).
  - *Acceptance:* completing the wizard creates a property row and immediately produces a non-empty maintenance schedule (Rules & Scheduling PRD).
- **Appliance records per system selected**: kind, brand, model, install year.
  - *Acceptance:* each system flagged in onboarding creates a corresponding appliance record, even if fields are initially blank.
- **Property switcher**: visible from any screen, shows all of an owner's properties.
  - *Acceptance:* switching property updates every view (dashboard, schedule, vendors, etc.) to that property's context with no stale data from the previous property.
- **Incomplete-appliance indicator**: dashboard surfaces appliances missing brand/model/year.
  - *Acceptance:* an appliance with any blank field appears in the "incomplete" list; filling all three removes it.
- **Edit property / appliance after creation.**
  - *Acceptance:* changes save and immediately affect the derived schedule (e.g., removing a system removes its rules).

### Nice-to-Have (P1)
- Property photo/thumbnail for quick visual identification in the switcher.
- Bulk-add appliances via a short list instead of one at a time.
- "Duplicate property" to speed up onboarding a second, similar unit.

### Future Considerations (P2)
- Shared/delegated access to a single property (co-host, property manager, owner's accountant with read-only view).
- Attachments per appliance (receipt, warranty card, manual PDF).
- Floor-plan or unit-map view.

## Success Metrics

**Leading indicators**
- Onboarding completion rate: % of started property wizards that finish (target: 85%+).
- Time to complete onboarding for one property (target: under 10 minutes median).
- % of appliances with all three fields (brand/model/year) filled within 30 days of creation (target: 60%+).

**Lagging indicators**
- Properties per active owner over time (does the product earn multi-property adoption?).
- Churn correlated with incomplete appliance data (hypothesis: owners who never finish their inventory are more likely to abandon the app).

## Open Questions

- Should install year be required or optional at creation time? (Product — optional today, but it drives the "incomplete" nudge; need a decision on whether to force it up front vs. nudge later.)
- How do we handle a property that changes systems mid-year (e.g., swaps a tank water heater for tankless) without losing the service history tied to the old appliance? (Engineering — likely needs an "archived" flag on appliances, mirroring the approach already used for custom rules.)
- What's the real ceiling on properties-per-owner the UI needs to support gracefully — 10? 50? (Product — affects whether the property switcher needs search/filtering.)

## Timeline Considerations

- **Dependency:** This is the foundational data layer — Maintenance Rules & Scheduling, Vendor Management, and Completions all read from `properties` and `appliances`. It must be wired to the live database (Step 3 in `PLAN.md`) before any of those features can go live for real users.
- **Phasing:** No reason to delay P1/P2 items; they don't block the core loop and can ship incrementally after the database migration.
