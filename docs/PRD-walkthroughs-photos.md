# PRD: Walkthroughs & Photo Documentation

**Area owner:** Product + Engineering + Design
**Related tables:** `walkthroughs`, `walkthrough_items`
**Status:** Built in `index.html`; checklist flow and no-login vendor link work; photos currently stored as base64 in browser storage, not cloud storage — this is the one piece of the feature actively known to be incomplete

---

## Problem Statement

Absentee owners — and even on-site owners — need a documented, dated, photographed record of a property's condition: for security deposit disputes, insurance claims, or just knowing nothing's been quietly deteriorating between visits. Today this is a "full property walkthrough" catalog rule like any other (every 6 months), but it's fundamentally different from a filter swap: it needs a structured checklist by area, a status per item, a note, and a photo — and it needs to be doable by someone other than the owner (a vendor or cleaner on-site) without that person needing an account.

## Goals

1. A walkthrough can be completed by anyone with the link — owner, vendor, or cleaner — with no login required.
2. Every checklist item records a status (ok / needs attention / not applicable), an optional note, and an optional photo.
3. Photos are reliably captured and durably stored — today's local-storage approach is the known gap this PRD exists to close.
4. A completed walkthrough is a usable artifact on its own (shareable, presentable) for deposit or insurance disputes, not just raw data in the app.

## Non-Goals

- **Live video walkthroughs or video calls** — this is an asynchronous, photo-based record, not a video feature.
- **AI-based damage detection from photos** — a real possible future differentiator, but far out of scope until the basic capture-and-store flow is solid.
- **Walkthroughs as the only way to log a condition issue** — guests and owners can still report issues outside a formal walkthrough (see Guest Requests PRD); walkthroughs are the *scheduled*, *comprehensive* version, not the only path.
- **Multi-party simultaneous editing of one walkthrough** — one person completes a given walkthrough session; no real-time collaboration.

## User Stories

- As any owner, I want to send a vendor or cleaner a link to complete a walkthrough, so I don't have to be physically present every time one is due.
- As a vendor completing a walkthrough, I want to do it without creating an account, so a tool I don't own doesn't become friction in my day.
- As any owner, I want each checklist item to support a status, note, and photo, so "needs attention" always comes with enough context to act on.
- As an absentee owner, I want to review a completed walkthrough's photos and notes remotely, so I know the property's condition without being there.
- As any owner, I want photos from a walkthrough to be safely stored and not lost to browser storage limits, so years of documentation don't silently disappear.
- As any owner, I want to reuse the walkthrough history (e.g., "what did the deck look like 6 months ago") for an insurance or deposit dispute, so the record has to be retrievable, not just capturable.

## Requirements

### Must-Have (P0)
- **No-login walkthrough link**: a unique `access_code` per walkthrough that opens a public, scoped view — never the full app.
  - *Acceptance:* opening the link without any session shows only that walkthrough's checklist, nothing else in the account.
- **Checklist items by area**: each item has area, label, status (ok/attention/na), note, photo.
  - *Acceptance:* every item independently records all five fields; submitting is possible with some items incomplete (not all-or-nothing).
- **Photo capture tied to the correct item**: a photo attaches to its specific checklist item, not a generic walkthrough-level bucket.
  - *Acceptance:* reviewing a completed walkthrough shows each photo next to the item it documents.
- **Cloud photo storage (the gap this PRD must close)**: photos move from base64-in-browser-storage to Supabase Storage, with `walkthrough_items.photo_path` pointing at the stored object.
  - *Acceptance:* completing a walkthrough on one device and reviewing it from a different device/browser shows the same photos. (This is impossible today — it's the core proof that this requirement is met.)
- **Started/completed/status lifecycle**: a walkthrough has a clear open vs. complete state.
  - *Acceptance:* an in-progress walkthrough is distinguishable from a finished one in any list view.

### Nice-to-Have (P1)
- Separate "taken at" from "uploaded at" timestamps per photo (flagged in `OPENSTR-COMPARISON.md` as a real-world gap — a photo taken with bad signal may upload hours later, and only one of those timestamps is evidence).
- PDF or shareable-link export of a completed walkthrough for sending to an insurer or in a deposit dispute.
- Resuming an in-progress walkthrough from where it was left off (e.g., vendor started it, owner finishes it).

### Future Considerations (P2)
- AI-assisted damage flagging from photos (compare against a prior walkthrough's photo of the same item/area).
- Scheduled reminder to the vendor/cleaner before a walkthrough is due, rather than the owner manually sending the link each time.
- Multi-photo per item (today implies roughly one photo per item; some conditions need more than one angle).

## Success Metrics

**Leading indicators**
- % of walkthroughs completed via the no-login link by someone other than the account owner (validates the delegation use case is actually used, not just theoretical).
- % of checklist items with a photo attached when status is "needs attention" (target: high — a flagged item without photo evidence is a weaker record).
- Photo upload success rate to cloud storage (target: 99%+ once migrated — this directly measures whether the P0 gap is actually closed).

**Lagging indicators**
- Walkthroughs referenced in an actual deposit or insurance dispute (hard to measure directly, but worth a qualitative check-in with users — this is the feature's real value proof).
- Storage-quota-related errors/complaints trending to zero after the cloud migration (today there's a known `QuotaExceededError` toast — this metric should disappear entirely).

## Open Questions

- Who should be able to generate/send a new walkthrough link — only the owner, or can a vendor request their own next one? (Product — affects whether this stays a one-directional owner-initiated flow.)
- Should walkthrough photos be private by default, or does the owner need a "share this walkthrough externally" explicit action for insurance/dispute use? (Design/Legal-adjacent — affects the access-code model's assumptions.)
- What's the retention policy for walkthrough photos — kept forever, or is there a storage-cost reason to eventually archive older ones? (Engineering/Product — relevant once real storage costs accrue at scale.)

## Timeline Considerations

- **This is the highest-priority deferred item.** The checklist UX is done; the cloud storage migration is the blocking gap, explicitly called out in `PLAN.md` Step 7 as the first deferred priority.
- **Dependency:** Needs Supabase Storage configured and `walkthrough_items.photo_path` wired — the column already exists and is correctly designed for this (confirmed in `sql/001_schema.sql`), so this is a storage-integration task, not a schema change.
- **Risk:** Until this ships, every walkthrough photo taken today is at risk of being lost to a full browser storage quota. Treat this as a data-loss risk, not just a feature gap.
