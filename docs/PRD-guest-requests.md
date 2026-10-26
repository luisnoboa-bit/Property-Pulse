# PRD: Guest Requests

**Area owner:** Product + Engineering + Design
**Related tables:** `requests`
**Status:** Built in `index.html` — guest-facing code-based submission form works; owner-side notification is the known gap (currently requires the owner to manually check the app)

---

## Problem Statement

Guests are the people most likely to notice a maintenance problem first — a leaking faucet, a broken AC, a dead smoke detector — but they have no good way to tell the owner that doesn't feel like filing a support ticket or texting a stranger's personal number. Owners, meanwhile, want guest-reported issues to land in the *same* queue as everything else that's due or overdue, not in a separate inbox they have to remember to check. Today the guest-facing form exists and works, but the owner has no way to know a request came in without opening the app — which defeats the purpose for anything urgent.

## Goals

1. A guest can report an issue in under a minute, with no account, from their phone, during their stay.
2. Every guest request lands in the same prioritized queue the owner already checks for maintenance, not a separate system.
3. Urgent requests reach the owner fast enough to matter (same-day, not "whenever I next open the app") — this is the gap this PRD is really about.
4. The owner can respond to and resolve a request with a clear record of what was reported, what was done, and when.

## Non-Goals

- **Two-way messaging/chat with the guest** — this is a report-and-resolve flow, not a live chat system. A follow-up question to the guest would go through normal messaging channels (Airbnb/VRBO messaging, SMS), not inside PropertyPulse.
- **Guest accounts or login** — the access-code link model (same pattern as Walkthroughs) stays the permanent design; guests should never need to sign up for anything.
- **Automatic triage/severity scoring by AI** — urgency is guest-selected today; automated severity inference is a future idea, not v1.
- **SLA tracking/guarantees to guests** — PropertyPulse helps an owner respond fast; it doesn't promise the guest a response time.

## User Stories

- As a guest, I want to report a problem using a code or link from my booking confirmation, so I don't need to create an account or find a phone number.
- As a guest, I want to say how urgent something feels (e.g., "AC not working" vs. "cabinet handle loose"), so the owner can tell what needs same-day attention.
- As any owner, I want an urgent guest request to actually notify me, not just sit in the app until I happen to check, so a guest's bad experience doesn't compound while I'm unaware.
- As any owner, I want guest requests to show up alongside scheduled maintenance, so I'm triaging one list, not two.
- As any owner, I want to add my own note and mark a request resolved, so there's a record of what was done and the guest's issue doesn't silently vanish from view.
- As a multi-property owner, I want to tell at a glance which property a request came from, since I'm not on-site to already know.

## Requirements

### Must-Have (P0)
- **No-login submission form**: guest name, email, title, body, trade (optional), urgency.
  - *Acceptance:* a guest can submit a request using only the property's `guest_code`, with no account creation step.
- **Request queue per property**: status (new/in progress/resolved), owner note field.
  - *Acceptance:* every submitted request appears in the owner's queue for the correct property, with status changeable by the owner.
- **Urgency surfaced clearly**: requests marked urgent are visually distinct and sorted above routine ones.
  - *Acceptance:* an "urgent" request appears above "normal" requests in the default queue sort.
- **Owner notification on submission (the core gap this PRD exists to close)**: at minimum, an email or push notification when a new request — especially an urgent one — comes in.
  - *Acceptance:* submitting a request as a guest results in the owner receiving a notification within minutes, without the owner having opened the app.
- **Trade-aware**: a request can optionally specify a trade, feeding the same vendor-matching logic used elsewhere.
  - *Acceptance:* a request tagged with a trade shows the matching vendor from the directory, same as a scheduled task would.

### Nice-to-Have (P1)
- Photo attachment on the guest submission form (a guest describing "the faucet is leaking" with a photo is far more actionable than text alone).
- Owner reply visible to guest (one-way status update: "fixed," "scheduled for tomorrow") without full two-way chat.
- Request-to-completion conversion: resolving a request can optionally log a Completion against the relevant rule, so ad hoc guest-driven fixes also build service history.

### Future Considerations (P2)
- Severity auto-suggestion based on keywords ("no hot water," "smoke," "locked out") to help an owner triage faster.
- Aggregate reporting: which properties generate the most guest requests, and for what — a signal for where preventive maintenance is failing.
- Guest-side status visibility via the same link (check if their reported issue has been addressed).

## Requirements — Acceptance Criteria Detail (Notification, since it's the P0 gap)

- Given a guest submits a request marked "urgent"
- When the submission completes successfully
- Then the owner receives an email (at minimum) within 5 minutes, containing the property name, request title, and a link into the app

- Given a guest submits a request marked "normal"
- When the submission completes successfully
- Then the owner receives a notification (email or digest, per Notifications PRD) without needing to be real-time for non-urgent items

## Success Metrics

**Leading indicators**
- Time from guest submission to owner first view (target: under 1 hour for urgent requests once notifications ship — today this is unbounded, since nothing alerts the owner).
- % of requests that include a trade tag (helps measure whether the vendor-matching value is actually being used).
- Guest completion rate of the submission form (started vs. submitted — target: 90%+, since any guest who starts this has an active problem and shouldn't abandon it).

**Lagging indicators**
- % of urgent requests resolved same-day after notifications ship (this is the metric that proves the P0 gap closing actually mattered).
- Guest-reported issues that correlate with a *missed* scheduled maintenance task (a signal that the preventive schedule itself needs tuning, not just that requests need faster handling).

## Open Questions

- Email, push, or both for owner notifications — and does this require the Accounts & Login push infrastructure to exist first, or can email ship standalone sooner? (Engineering — likely email-first is faster to ship.)
- Should urgency be guest-selected (as today) or should the category of issue (e.g., "no hot water") imply urgency automatically? (Product/Design — guest-selected is simpler but less reliable.)
- Does a resolved request need to notify the guest at all, given there's no guest account to log back into? (Product — ties into the P1 "owner reply visible to guest" idea.)

## Timeline Considerations

- **This PRD's P0 notification requirement and the separate Notifications PRD overlap** — recommend building the "urgent guest request" notification path first (narrower, higher-value), and letting the general past-due digest (Notifications PRD) follow once the underlying email infrastructure exists. Don't build two separate notification systems.
- **Dependency:** Requires `guest_code` on properties (already exists per `sql/001_schema.sql`) and Vendor Management for the trade-matching requirement.
