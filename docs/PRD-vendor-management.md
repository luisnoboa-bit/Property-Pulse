# PRD: Vendor Management

**Area owner:** Product + Engineering
**Related tables:** `vendors`
**Status:** Built in `index.html` — directory, trade-matching, and local vendor search are working; not yet wired to live database

---

## Problem Statement

Every maintenance task needs someone to do it, and "who do I call for this" is a recurring point of friction for owners, especially absentee owners managing a property from another city or country. Without a structured vendor directory, owners default to texting whoever they used last time, re-finding a number in old messages, or searching the web cold each time — and there's no way for the app to proactively suggest "this task needs an HVAC tech, and you already have one" unless vendors are tagged with the trades they cover.

## Goals

1. An owner can find the right vendor for any overdue task in one tap, without leaving the task view.
2. Every vendor record is tagged with the trade(s) it covers, so matching is automatic rather than manual lookup.
3. When no vendor is on file for a needed trade, the owner gets a path to find one (local search) rather than a dead end.
4. Vendor records remain useful across years — contact info, notes, and trade coverage stay current without re-entry.

## Non-Goals

- **Vendor marketplace or booking integration** (e.g., scheduling directly through a third-party service like Thumbtack) — out of scope; PropertyPulse surfaces who to call, not a booking flow.
- **Vendor ratings/reviews shared across owners** — a multi-tenant social feature with real moderation and trust implications; not v1, possibly never without a dedicated trust & safety investment.
- **Automatic vendor invoicing or payment** — PropertyPulse records what a vendor was paid (via Completions), it doesn't process payment.
- **Vendor-side accounts or portals** — vendors interact via the no-login walkthrough link (see Walkthroughs PRD), not a full account.

## User Stories

- As any owner, I want every overdue task to show the matching vendor from my directory automatically, so I don't have to remember who handles what.
- As any owner, I want to see a sensible fallback (e.g., my handyman) when I don't have a specialist for a given trade, so I'm never stuck with "no vendor, no next step."
- As an absentee owner, I want to search for a local vendor by trade directly in the app when I don't have one saved, so I'm not switching to a separate browser search mid-task.
- As any owner, I want to store multiple trades per vendor (e.g., a handyman who also does basic plumbing), so I don't need duplicate entries for one person.
- As a multi-property owner, I want my vendor directory to be shared across all my properties (not re-entered per property), so adding a property doesn't mean rebuilding my contact list.

## Requirements

### Must-Have (P0)
- **Vendor record**: name, trades (multi-select), location, email, phone, notes.
  - *Acceptance:* a vendor can be tagged with more than one trade and appears correctly in matching for each.
- **Automatic trade matching**: a task's required trade surfaces an exact-match vendor first; falls back to a tagged "handyman" vendor if no exact match exists.
  - *Acceptance:* a task requiring `plumbing` shows a plumbing-tagged vendor if one exists; otherwise shows a handyman-tagged vendor if one exists; otherwise shows a clear "no vendor saved" state with the trade name.
- **One-tap contact**: phone/email visible and actionable directly from the task view, no extra navigation.
  - *Acceptance:* the vendor's phone number or email is tappable from the vendor chip shown on a task.
- **Local vendor search fallback**: when no vendor is saved for a needed trade, offer a search path (trade-specific search term) rather than a dead end.
  - *Acceptance:* a task with no matching vendor shows a search prompt using the correct trade-specific term (e.g., "certified chimney sweep," not generic "vendor").
- **Vendor directory shared across properties**: one directory per owner account, not per property.
  - *Acceptance:* a vendor added while viewing Property A is available and matchable when viewing Property B.

### Nice-to-Have (P1)
- Vendor usage history: "last used on [date] for [task]" visible on the vendor record itself, not just from the completion's side.
- Favorite/pin a preferred vendor among multiple matches for the same trade.
- Notes field prompts (e.g., "rates," "availability") rather than a blank free-text box.

### Future Considerations (P2)
- Vendor-facing lightweight portal (beyond the current no-login walkthrough link) to see their own job history with an owner.
- Shared vendor recommendations across owners in the same region (the marketplace/trust question flagged in Non-Goals — would need real moderation investment).
- Vendor performance signals (on-time rate, repeat-task cost trend) derived from Completions data.

## Success Metrics

**Leading indicators**
- % of overdue tasks with an exact-trade vendor match (target: increases over time as directories fill in — this is a proxy for directory completeness).
- % of trades with zero saved vendor (the gap this feature needs to close — track per owner, target trending toward zero for commonly-needed trades).
- Local-search-fallback usage rate (high usage signals directory gaps worth prompting owners to fill).

**Lagging indicators**
- Correlation between vendor directory completeness and time-to-resolve for overdue tasks (does having the right vendor on file actually speed up getting maintenance done?).
- Vendor reuse rate — are owners calling the same saved vendor repeatedly (directory is working) or constantly searching fresh (directory isn't trusted/complete)?

## Open Questions

- Should the app proactively prompt an owner to add a vendor the first time a trade has no match, rather than waiting for them to notice the fallback state? (Product/Design — likely yes, but needs to avoid feeling naggy.)
- Is "handyman" the only fallback trade, or should there be a small hierarchy (e.g., general contractor also catches overflow)? (Product — currently hardcoded to handyman only.)
- Do multi-property owners ever want *different* preferred vendors per property for the same trade (e.g., two plumbers in two different towns)? Today the directory is flat per owner, not per property. (Product — directly affects whether this is P1 or a data-model change.)

## Timeline Considerations

- **Dependency:** Trade matching depends on Maintenance Rules & Scheduling (each rule's `trade` field) and is referenced by Completions (`vendor_id` on a completion).
- **Phasing:** P0 is functionally complete in the prototype; the database migration (Step 3) is the main remaining lift, not new feature work.
