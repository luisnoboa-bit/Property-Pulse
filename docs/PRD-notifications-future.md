# PRD: Notifications (Future)

**Area owner:** Product + Engineering
**Related tables:** `profiles.digest_enabled` (already exists as a preference flag; no sending infrastructure built yet)
**Status:** Not started. Explicitly deferred in `PLAN.md` Step 7 as "the Monday morning past-due email." This PRD specs it so it's ready to build when prioritized, not to commit to a date.

---

## Problem Statement

PropertyPulse only has value if owners actually see what's due — but today, seeing it requires remembering to open the app. An owner who doesn't check for a few weeks gets no reminder that three tasks quietly went overdue. This undermines the core promise of the product: that preventive maintenance stops depending on human memory. The `profiles` table already has a `digest_enabled` preference column, anticipating this feature, but no notification currently gets sent.

## Goals

1. An owner who never opens the app proactively still finds out when something is overdue, without having to remember to check.
2. Notifications are useful, not noisy — an owner with nothing overdue doesn't get an empty or redundant email every week.
3. The same notification infrastructure built here can be reused for the urgent guest-request alert specified in the Guest Requests PRD, rather than building two separate systems.
4. Owners can control frequency/opt out without losing the underlying due-date tracking (the preference, not the data, changes).

## Non-Goals

- **Real-time push notifications** — a weekly or daily digest email is the v1 target; mobile push requires infrastructure (and likely a native/PWA wrapper) not yet in place.
- **SMS notifications** — email-first; SMS has cost-per-message and deliverability complexity not justified until email digest is proven valuable.
- **Per-task granular notification settings** (e.g., "notify me about HVAC but not pool") — v1 is one digest per property per owner, not per-rule configuration.
- **Vendor or guest-facing notifications** — this PRD covers owner notifications only. (A guest-facing "your request was resolved" notification is a separate, smaller future idea noted in the Guest Requests PRD.)

## User Stories

- As any owner, I want a periodic email summarizing what's overdue and what's coming up soon, so I don't have to remember to check the app.
- As any owner, I want to turn this off if I check the app frequently enough on my own, so I'm not annoyed by redundant emails.
- As a multi-property owner, I want one digest covering all my properties (not one email per property), so my inbox doesn't get spammed as my portfolio grows.
- As any owner, I want an urgent guest request to interrupt the normal digest cadence and notify me immediately, rather than waiting for the next scheduled email (cross-reference: Guest Requests PRD).
- As any owner, I want the digest to only mention what's actually changed or still outstanding, so it stays worth opening every time.

## Requirements

### Must-Have (P0)
- **Weekly past-due digest email**: one email per owner, listing overdue tasks across all their properties, grouped by property.
  - *Acceptance:* an owner with overdue tasks on 2 properties receives one email listing both, not two separate emails.
- **Respects `digest_enabled` preference**: already exists as a column; this feature must honor it from day one.
  - *Acceptance:* toggling the preference off stops future emails without deleting any underlying schedule data.
- **No email when there's nothing to report**: an owner with zero overdue tasks does not receive an empty digest.
  - *Acceptance:* the send job skips owners with nothing overdue that cycle.
- **Immediate urgent-request alert** (shared infrastructure with Guest Requests PRD): a separate, immediate email distinct from the weekly digest cadence.
  - *Acceptance:* an urgent guest request triggers its own email within minutes, independent of the weekly digest schedule.

### Nice-to-Have (P1)
- Configurable cadence (daily/weekly/monthly) instead of fixed weekly.
- "Upcoming in the next 2 weeks" section in addition to overdue, so the digest is forward-looking, not just a backlog report.
- Direct deep-links from the email into the specific task/property in the app.

### Future Considerations (P2)
- Mobile push notifications (depends on a native or PWA wrapper existing).
- SMS for owners who prefer it over email.
- Per-rule or per-trade notification granularity.

## Success Metrics

**Leading indicators**
- Digest email open rate (target: 40%+ — a reasonable bar for a transactional-feeling but not purely transactional email).
- % of owners who keep `digest_enabled` on 30 days after turning it on (measures whether it's actually useful vs. annoying).
- Time from an urgent guest request to owner notification sent (target: under 5 minutes — shared metric with the Guest Requests PRD).

**Lagging indicators**
- Reduction in average overdue-task age for owners with digests enabled vs. disabled (the core hypothesis: does the nudge actually change behavior?).
- Retention difference between digest-enabled and digest-disabled owners over 90 days.

## Open Questions

- Is weekly the right default cadence, or should new owners start on a tighter cadence (e.g., daily) until their backlog is under control, then taper to weekly? (Product.)
- What email sending infrastructure does this use — same provider as Supabase auth emails, or a separate transactional email service? (Engineering — affects deliverability and whether this is a quick build or a new vendor integration.)
- Should the urgent guest-request alert and the weekly digest share a single "notifications" settings surface in the UI, or stay conceptually separate since one is urgent and one is routine? (Design.)

## Timeline Considerations

- **Explicitly deferred** — not committed to a date; this PRD exists so the feature is scoped and ready whenever it's prioritized, consistent with its "Step 7, deferred" status in `PLAN.md`.
- **Build-order recommendation:** build the urgent guest-request alert first (narrower scope, directly tied to a P0 gap in the Guest Requests PRD), then extend the same email infrastructure to the weekly digest. Building the digest first without the urgent-alert use case risks over-engineering for a need that isn't there yet.
- **Dependency:** Requires Maintenance Rules & Scheduling's due-date computation to be reliable (already true) and an email-sending integration to exist (not yet built).
