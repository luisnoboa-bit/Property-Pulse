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
- [ ] **1.6 (Y)** Commit and push the new `sql/` folder in GitHub Desktop.

Save `sql/checks.sql` as a named snippet in the Supabase SQL editor rather than opening a new query tab each time. Highlight one query and press Cmd+Enter to run just that one.

## Step 2 — logins (1 hr)

- [ ] **2.1 (Y)** In Supabase, go to Settings → API and copy the **Project URL** and the **anon public** key. Paste both to me. Both are safe to publish; the one to never share is `service_role`.
- [ ] **2.2 (me)** Add the Supabase library, a login screen, and a trigger on `auth.users` that creates the `profiles` row automatically at signup.
- [ ] **2.3 (Y)** Review the diff in GitHub Desktop, commit, push. Wait for Netlify to redeploy.
- [ ] **2.4 (Y)** Sign up with your real email. Confirm you land in the app.
- [ ] **2.5 (Y)** **The security proof.** Open a private window, sign up with a throwaway email, and confirm that account sees none of your data. This is the test that proves Step 1 worked. Nothing else proves it.

## Step 3 — wire the core loop to the database (2 sessions)

Covers properties, appliances, vendors, completions and custom rules — the maintenance loop. Walkthroughs and guest requests come later, in Step 7, because they need photo storage.

- [ ] **3.1 (me)** Write the read function: fetch your tables, assemble the `S` object the app already expects, make the boot line async.
- [ ] **3.2 (me)** Convert the 25 `commit()` call sites from "save everything" to targeted writes.
- [ ] **3.3 (Y)** Review the diff, commit, push.
- [ ] **3.4 (Y)** Add a property. Refresh the page. If it's still there, the database is live.

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
