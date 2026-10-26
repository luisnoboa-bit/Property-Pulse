# PRD: Accounts & Login

**Area owner:** Product + Engineering
**Related tables:** `profiles` (plus Supabase `auth.users`)
**Status:** Sign-in/sign-up screens built and gated behind a session; account creation and email confirmation working; Supabase redirect URL misconfiguration currently breaks confirmation links (see `PLAN.md` Step 2.4b) — this is the active blocker

---

## Problem Statement

Everything else in PropertyPulse — properties, vendors, service history — is worthless if it isn't private to the owner who entered it, and inaccessible from a second device if it only lives in that one browser's local storage. Owners need a real account so their data follows them to their phone, survives a browser cache clear, and is provably isolated from anyone else using the product. This is also the feature that turns PropertyPulse from "a file on my laptop" into "a real tool" — the phone-access milestone depends entirely on this working correctly.

## Goals

1. An owner can create an account, confirm it, and sign in from any device — phone included — and see their own data and nothing else's.
2. Row-level security guarantees data isolation between accounts, provably (not just by convention).
3. The sign-up flow has no dead ends — every step (confirmation email, redirect, first-login state) works without manual intervention.
4. A frictionless demo path exists for people evaluating the product (recruiters, prospective users) without them needing their own real data or a confirmed email.

## Non-Goals

- **Social login (Google/Apple sign-in)** — email/password is sufficient for v1; social login is a conversion-rate optimization for later, not a blocker to anything else.
- **Multi-user accounts / team seats** (e.g., an owner inviting a property manager with limited permissions) — out of scope until there's demonstrated demand; today one account = one owner, full access to everything they created.
- **Two-factor authentication** — not warranted yet at this user base and risk level; revisit if the product ever handles payment data directly.
- **Password-less/magic-link-only auth** — password-based with email confirmation is the chosen pattern; not revisiting unless conversion data says otherwise.

## User Stories

- As a new owner, I want to create an account with my email and a password, so my data is mine and follows me across devices.
- As a new owner, I want the confirmation email to actually work, so I'm not stuck unable to log in after signing up.
- As any owner, I want a `profiles` row to exist automatically the moment I confirm my account, so every feature that depends on owning data (properties, vendors) works immediately, not after some manual setup step.
- As any owner, I want to be confident that another account literally cannot see my properties, so I trust the product with real information about my home.
- As a prospective user or recruiter evaluating the product, I want a ready-made demo login with realistic sample data, so I can see the product's value without creating a real account or making up fake data myself.
- As any owner, I want to sign out clearly and have that actually end my session, so a shared or borrowed device doesn't stay logged into my account.

## Requirements

### Must-Have (P0)
- **Email/password sign-up and sign-in**, gating all app views behind a valid session.
  - *Acceptance:* no property, vendor, or completion data is visible or reachable without an authenticated session.
- **Email confirmation required before sign-in.**
  - *Acceptance:* an unconfirmed account cannot sign in; the confirmation link, when clicked, successfully confirms and lands the user in the app — not on a broken `localhost` redirect. (This is today's live bug: Supabase's **Site URL** is still the `localhost:3000` placeholder; it must be set to the production Netlify URL before this requirement is actually met.)
- **Automatic profile creation**: a database trigger creates a `profiles` row the moment a new `auth.users` row is confirmed.
  - *Acceptance:* signing up and confirming never requires a separate manual step to "activate" the account — the first insert into `properties` or `vendors` succeeds immediately.
- **Row-level security on every table**: every owner-scoped table enforces `auth.uid() = owner_id` (or the equivalent ownership chain) at the database level, not just in app logic.
  - *Acceptance:* a second account, in a private browser session, signing in and attempting to view another owner's properties sees none of them — proven by test, not assumed.
- **Sign out**: clears the session fully.
  - *Acceptance:* after sign-out, reloading the app requires signing in again; no cached data from the previous session is visible.

### Nice-to-Have (P1)
- Password reset flow (forgot password → email → reset).
- "Remember me" / longer session duration on trusted devices, especially relevant for phone use.
- Basic profile fields (name, phone) surfaced in account settings, not just captured silently at signup.

### Future Considerations (P2)
- Team seats / delegated access (a property manager account that can see but not necessarily edit an owner's properties) — directly relevant if PropertyPulse is ever positioned at multi-property management companies rather than individual owners.
- Social login.
- Two-factor authentication.

## Success Metrics

**Leading indicators**
- Sign-up completion rate (account created → email confirmed → first successful login) — target: 80%+. Today this is actively broken by the redirect bug, so baseline measurement should happen only after the fix ships.
- Time from sign-up to first property created (measures whether auth friction delays real usage).
- Zero cross-account data leakage in RLS testing (binary pass/fail, tested explicitly — see Step 3.5 in `PLAN.md`).

**Lagging indicators**
- % of owners who successfully log in from a second device (phone) within their first week — this is the actual proof the account system delivered its core value.
- Demo-account usage by recruiters/prospects as a leading indicator for the product's "portfolio piece" and eventual go-to-market value.

## Open Questions

- Should the demo account's data reset automatically on a schedule, or does the owner manually refresh it periodically? (Product — affects whether the demo stays presentable without manual upkeep.)
- Is the current one-account-per-owner model a real long-term constraint, or will team seats (P2) become necessary sooner than expected if this is marketed to property management companies rather than individual hosts? (Product — worth revisiting once there's real user feedback, not before.)
- Does password reset (P1) need to ship before real users rely on this day to day, or is it acceptable to launch without it briefly? (Engineering/Product — recommend not launching broadly without it; a locked-out owner with no reset path is a support nightmare.)

## Timeline Considerations

- **Active blocker:** The Supabase **Site URL** / redirect URL configuration must be fixed before this feature can be considered working at all — it's not a nice-to-have, it's the current P0 bug blocking real account confirmation (`PLAN.md` Step 2.4b).
- **Sequencing:** The profile trigger (`sql/004_profile_trigger.sql`) must run *before* any further accounts are created with the login flow live — running it late risks accounts with no `profiles` row, which breaks every downstream insert.
- **Dependency:** Everything else (Properties, Vendors, Completions, Walkthroughs, Guest Requests, Notifications) is scoped to an owner via this feature. It must be fully correct, including the RLS proof, before real user data goes into the live database.
