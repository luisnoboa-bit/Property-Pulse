# PropertyPulse — setup checklist

Replaces `SETUP-CHECKLIST.md`. Rename that file to `SETUP-CHECKLIST-old.md` rather than deleting it; the Phase 4–7 notes in it are still useful.

Your nine-table Supabase schema stays exactly as written. Nothing gets rebuilt.

## The five places, one job each

| Place | The one question it answers |
|---|---|
| Your folder + me | Where work happens. I edit the files here. |
| GitHub Desktop | What am I about to publish? (the green/red diff) |
| GitHub.com | What is the code? (the copy recruiters read) |
| Netlify | Is the site live? |
| Supabase | Where is the data? |

VS Code is gone — I do the editing. To read code yourself, open the repo on GitHub.com and press the `.` key.

**(Y)** = you, **(me)** = I do it and you review the diff.

---

## Step 0 — confirm where you actually are (5 min)

- [ ] **0.1 (Y)** Open your Netlify URL. If the app loads, Phase 0 is done. If not, say so and we fix that first.
- [ ] **0.2 (Y)** Open GitHub Desktop. Confirm no uncommitted changes are sitting there from before.

## Step 1 — finish database security (20 min)

All SQL now lives in the `sql/` folder. `001_schema.sql` and `002_rls.sql` are already applied — they're there as the record, not to run again. See `sql/README.md` for the convention.

- [x] **1.1** RLS enabled and policies created on all nine tables (`002_rls.sql`).
- [x] **1.2** Verified: nine rows, `rls_on = true` on all nine.
- [x] **1.3** Investigated the count mismatch on `profiles`. Three policies, all testing `(auth.uid() = id)`, no leak — two were redundant additions from the dashboard's policy wizard.
- [ ] **1.4 (Y)** Run `sql/003_policy_cleanup.sql`. Drops the two redundant profile policies and adds `custom_rules.archived`.
- [ ] **1.5 (Y)** Run query 1 in `sql/checks.sql` again. Expect `requests` = 3 and every other table = 1. That closes old checklist step 1.8.
- [x] **1.6** `sql/` folder pushed (commit `ac9af00`).

Save `sql/checks.sql` as a named snippet in the Supabase SQL editor rather than opening a new query tab each time. Highlight one query and press Cmd+Enter to run just that one.

## Step 2 — logins (1 hr)

- [x] **2.1** Project URL `https://wcmnxtqjoretnboplcos.supabase.co` and the anon key are in `index.html`. Both safe to publish; the one to never share is `service_role`.
- [x] **2.2 (me)** Supabase library added, sign in / create account screen built, app views gated behind a session, sign out in the sidebar.
- [ ] **2.3 (Y)** Run `sql/004_profile_trigger.sql` in Supabase. Creates the `profiles` row automatically at signup. **Do this before 2.5**, otherwise the new account has no profile row and every insert later fails.
- [ ] **2.4 (Y)** Supabase → Authentication → Sign In / Providers. If **Confirm email** is on, either turn it off for now or be ready to click a link in your inbox. Either is fine; you just need to know which.
- [ ] **2.5 (Y)** Review the diff in GitHub Desktop, commit, push. Wait for Netlify to redeploy.
- [ ] **2.6 (Y)** Create an account with your real email. Confirm you land in the app.
- [ ] **2.7 (Y)** Run queries 4 and 5 in `sql/checks.sql`. Query 4 should return **zero rows** (every account has a profile), query 5 should return **one row** (the trigger is attached).
- [ ] **2.8 (Y)** In a private window, create a second account with a throwaway email. It should sign in and reach an empty setup wizard.

**What Step 2 does not prove.** Your properties still load from this browser's storage, not from the database — Step 2 added the account, not the data move. So 2.8 tests that signup works, and nothing more. If the second account somehow shows your property, that is localStorage being shared, not a security hole. The real isolation test is Step 3.5, after the data actually lives in Supabase.

## Step 3 — wire the core loop to the database (2 sessions)

Covers properties, appliances, vendors, completions and custom rules — the maintenance loop. Walkthroughs and guest requests come later, in Step 7, because they need photo storage.

- [ ] **3.1 (me)** Write the read function: fetch your tables, assemble the `S` object the app already expects, make the boot line async.
- [ ] **3.2 (me)** Convert the 25 `commit()` call sites from "save everything" to targeted writes.
- [ ] **3.3 (Y)** Review the diff, commit, push.
- [ ] **3.4 (Y)** Add a property. Refresh the page. If it's still there, the database is live.
- [ ] **3.5 (Y)** **The security proof.** Sign in as the throwaway account from 2.8, in a private window. It must see none of your properties. This is the test that proves Step 1's RLS worked — nothing before this point proves it, because until now the data never left the browser.

## Step 4 — the phone test (30 min)

- [ ] **4.1 (Y)** Open the Netlify URL on your phone. Log in.
- [ ] **4.2 (Y)** Mark a task done on the phone, then refresh your laptop and watch it appear.

This is the milestone. After this it's a real tool.

## Step 5 — the demo account (30 min)

- [ ] **5.1 (Y)** In Supabase, Authentication → Users → Add user. Make a demo email and password.
- [ ] **5.2 (Y)** Log in as that user in a private window. Run onboarding with a fictional property and a few months of plausible history.
- [ ] **5.3 (me)** Put the demo credentials at the top of the repo README so recruiters find them immediately.

## Step 6 — your actual apartments (1–2 hrs, no rush)

- [ ] **6.1 (Y)** Enter your three Cabarete units, their systems, appliances, and whatever service history you can reconstruct.
- [ ] **6.2 (Y)** Add your real vendors.

## Step 7 — deferred, in rough priority order

Walkthroughs and photos moving to Supabase Storage (`walkthrough_items.photo_path` is already the right column, waiting). The Monday morning past-due email. Guest and vendor links — note that `guest_code` and `access_code` exist but no policy consults them yet, so those pages currently return nothing rather than erroring. Per-property interval overrides, so a mini-split filter can be every two months at one unit and every three at another; salt air on the north coast is harder on coils than the generic defaults assume.

---

## Two things about your schema worth remembering

`completions.rule_id` is text so it can hold either a built-in rule key or a custom rule's uuid. Postgres can't enforce that, so a deleted custom rule leaves completions pointing at nothing — history intact in the table, but the app treats the task as never done, silently. Step 1.2 is the guard: archive, never delete.

Your `for all using (...)` policies with no `with check` are correct, not a gap. Postgres reuses the `using` expression as the check when you omit it, so inserting a row owned by someone else is already blocked.
