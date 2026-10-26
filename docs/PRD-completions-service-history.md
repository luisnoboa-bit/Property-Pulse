# PRD: Completions & Service History

**Area owner:** Product + Engineering
**Related tables:** `completions`
**Status:** Built in `index.html`; this is one of the 25 `commit()` call sites being converted to targeted database writes (Step 3 of `PLAN.md`)

---

## Problem Statement

A maintenance schedule is only useful if marking something "done" is fast and the record it leaves behind is actually usable later — to prove a repair happened, to answer "what did this cost me last year," or to settle a dispute with a vendor. Most owners currently have no structured record of this at all: receipts in email, a vague memory of "the AC guy came sometime in spring." Without a service history, an owner can't answer "is this unit actually profitable" or negotiate a fair price on a repeat repair, and the maintenance schedule itself can't compute accurate due dates.

## Goals

1. Logging a completed task takes under 30 seconds for the common case (date defaults to today, cost and note optional).
2. Every completion permanently and accurately updates the next due date for its rule.
3. Owners can answer "how much have I spent on maintenance this year / this property / this vendor" without exporting to a spreadsheet.
4. Service history survives rule changes — renaming or retiring a rule never orphans or deletes historical completions.

## Non-Goals

- **Automatic cost estimation or budgeting** (e.g., predicting next year's maintenance spend) — a real future feature, not v1; this PRD covers recording actuals only.
- **Invoice/receipt attachment storage** — adjacent, deferred; completions record a note and a cost number, not a file.
- **Multi-currency support** — out of scope until there's a real multi-region user, Luis's case included (single currency per owner is fine today).
- **Approval workflows** (e.g., a property manager approving a vendor's logged cost before it counts) — no concept of hierarchy yet; see Accounts & Login for whether multi-user roles are ever needed.

## User Stories

- As any owner, I want to mark a task done with one tap and optionally add cost/vendor/notes, so logging maintenance never feels like paperwork.
- As any owner, I want to see a running total of what I've spent on a property this year, so I know if it's actually profitable.
- As any owner, I want to see the full history of a specific recurring task (e.g., every HVAC filter change with dates and costs), so I can spot a vendor overcharging or a pattern of failure.
- As any owner, I want to snooze a task instead of marking it done, so I can acknowledge "not now" without falsely claiming it was serviced.
- As any owner, I want retiring or renaming a maintenance rule to never delete the history already logged against it, so years of records stay intact.
- As a multi-property owner, I want to compare spend across properties, so I can tell which unit is costing more to maintain than it should.

## Requirements

### Must-Have (P0)
- **Log a completion**: date (defaults to today), cost (optional), vendor (optional, linked to Vendor directory), note (optional).
  - *Acceptance:* submitting with only a date recalculates the due date correctly; cost/vendor/note are all independently optional.
- **Snooze without completing**: a `snoozed` flag that defers a task's visibility without claiming it was done.
  - *Acceptance:* a snoozed task does not appear as overdue, but also does not create a false completion record or affect cost totals.
- **Per-rule history view**: every completion for a given rule, on a given property, in date order.
  - *Acceptance:* opening the history for "HVAC filter" on a property shows every past completion with cost, vendor, and note intact.
- **Cost rollups**: total spend per property, per year, derivable from completions.
  - *Acceptance:* the sum matches a manual spreadsheet total for the same data, every time.
- **Orphan-safe deletes**: deleting or archiving a rule never deletes its completions.
  - *Acceptance:* archiving a custom rule keeps its completions queryable by history, even though the rule no longer appears in the active schedule. (This is the exact silent-failure case flagged in `PLAN.md` — "archive, never delete.")

### Nice-to-Have (P1)
- Edit or correct a past completion (fix a typo'd cost, wrong date).
- Filter/sort history by vendor, trade, or cost range.
- Export completions to CSV for an owner's own bookkeeping or tax prep.

### Future Considerations (P2)
- Attach a receipt/invoice file to a completion.
- Budget vs. actual comparison per property per year.
- Flag anomalous costs (e.g., "this vendor charged 3x their historical average for this task") — needs enough data volume to be meaningful.

## Success Metrics

**Leading indicators**
- Median time to log a completion (target: under 30 seconds).
- % of completions logged with a cost value filled in (target: 70%+ — this is the data that makes the feature valuable long-term, so it's worth tracking even though cost is optional).
- Snooze rate vs. completion rate (a high snooze rate on a given rule may indicate the interval is wrong, not that the owner is lazy — useful signal for the Rules & Scheduling team).

**Lagging indicators**
- Owners with 12+ months of completion history report higher perceived value / lower churn (hypothesis to validate once there's enough usage data).
- Reduction in "no vendor/no cost" completions over time, as owners build the habit of fuller logging.

## Open Questions

- Should cost be required for vendor-performed work but optional for DIY tasks, or always fully optional? (Product — affects both data quality and how much friction to add to the "mark done" flow.)
- Where does a deleted-but-restored rule's completion history "reconnect" visually — does the owner need to know a task was ever retired? (Design — mostly a display question, not a data-model one.)
- Is per-completion editing (P1) needed at launch, or can "delete and re-log" cover the correction case well enough for v1? (Product — simpler to build, slightly worse UX.)

## Timeline Considerations

- **Dependency:** Requires Properties & Appliances and Maintenance Rules & Scheduling to be live — completions are meaningless without a rule and a property to attach to.
- **Dependency:** Vendor Management's "vendor" field on a completion is optional, so Completions can ship slightly ahead of full Vendor Management if needed, but the two should land close together for a coherent experience.
- **Risk:** This is explicitly one of the 25 `commit()` call sites being converted to targeted writes in Step 3 — the highest-risk step in the current plan, since a bug here could silently miscalculate due dates across the whole schedule. Test the due-date recalculation path thoroughly before considering this "done."
