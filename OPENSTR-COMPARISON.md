# What OpenSTR's schema has that PropertyPulse doesn't

Notes from reading [OpenSTR](https://github.com/lkilpatrick/openstr) (GPL-3.0, Postgres 16, 27 migrations) against the current `index.html` prototype. Written before Phase 2, so the useful ones can go into the schema the first time rather than as a migration later.

**A licensing note first.** OpenSTR is GPL-3.0. Copying its code or its seeded checklist text into this repo would oblige this repo to become GPL too. Table names, column names and structural ideas are not the issue — those are facts about how a database is arranged, and everything below is described in my own words. Do not paste their task label text or their TypeScript.

## The two apps are not actually the same app

Worth saying up front, because it changes which parts are worth borrowing.

OpenSTR is **turnover-driven**. Its unit of work is a `clean_session`, created when a guest checks out, and the whole schema hangs off that: session → room_clean → task_completion → photo. Work exists because a booking ended.

PropertyPulse is **interval-driven**. Its unit of work is a rule with an `every` in months, and a task is due because time passed since the last completion. Work exists because the calendar moved.

So there is no table-for-table mapping. The borrowing is selective.

## Their schema, in brief

Twenty-seven tables. The ones that matter here:

`properties` carries the per-property config, including `ical_url`, `min_turnaround_hours`, and a `standard_id` pointing at a default template. `rooms` belong to a property and carry a `standard_room_type` that maps them onto template tasks. `standards` and `standard_tasks` are the **template catalog**, stored as rows. `tasks` are the **materialized per-property copies** of those templates, with `is_override`, `is_applicable` and `archived` flags. `reservations` are bookings pulled from an iCal feed. `issues` are defects with severity and status. `photos` reference a storage path, not image bytes.

Their checklist rows look like this shape:

```
standard_tasks:
  room_type      'kitchen' | 'bathroom' | 'bedroom' | 'living_room' | 'laundry' | 'entryway' | 'outdoor'
  label          the instruction text
  category       'Cleaning' | 'Sanitise' | 'Laundry' | 'Restocking' | 'Check'
  frequency      'every_clean' | 'weekly' | 'monthly'
  is_high_touch  boolean
  is_mandatory   boolean
  display_order  integer
  archived       boolean
```

About forty seeded rows across seven room types. The content is cleaning work, which is not what PropertyPulse does — the *structure* is the interesting part.

## Five things worth taking

### 1. Move the rule catalog out of code and into a table

Right now `RULES` is a hardcoded array in `index.html`. OpenSTR keeps the equivalent in `standard_tasks` rows.

Why it matters: with the catalog in code, changing one interval means edit, commit, push, redeploy. With it in a table, it is a row update. More importantly it lets a rule be *edited per property* rather than only added.

**The Cabarete case for this is strong.** The seeded intervals in the current build are generic — three months for a filter, twelve for a water heater flush. Salt air and year-round humidity on the north coast are harder on mini-split coils, exterior metal and anything with a seal than those defaults assume. Right now there is no way to say "this rule, at this apartment, every two months" without writing a duplicate custom rule and living with the original still nagging.

Suggested shape, keeping the current field names:

```
rule_templates   id, key, name, requires[], every_months, trade, season, why
property_rules   id, property_id, template_id (nullable), name, every_months,
                 trade, season, why, is_applicable, archived
```

`property_rules` rows with a `template_id` are the catalog copies; rows without one are today's custom rules. Same table, so the due-date calculation has one thing to read instead of two.

### 2. Point completions at a row, not a string

This is the silent-failure one, so it is worth being precise about it.

Today `completions.ruleId` holds a string like `'filter'` that matches a constant in the JS. Nothing enforces the match. Rename a rule id, or delete a custom rule, and the completion rows survive as orphans pointing at nothing — the history is still in the database, looking fine in a table view, but the app can no longer render it or compute a due date from it. Nothing errors. The task just quietly reappears as never-done.

OpenSTR avoids this with real foreign keys and `ON DELETE` behaviour declared per table. In Supabase:

```sql
rule_id uuid references property_rules(id) on delete restrict
```

`restrict` means Postgres refuses to delete a rule that has completions attached. That refusal is the feature — it forces the archive path instead.

### 3. Archive instead of delete

`archived boolean` appears on `rooms`, `tasks` and `standard_tasks` in their schema. Deleting a rule that has five years of service history attached destroys the history. Archiving hides it from the active list and keeps the record. Pairs with the foreign key above: `on delete restrict` blocks the delete, `archived = true` gives the user what they actually wanted.

### 4. Photos as storage paths, not base64

`photos` in their schema stores `storage_path`, `file_size_kb`, `taken_at` and `uploaded_at` — the bytes live on disk, the row is a pointer.

The current build reads photos with `readAsDataURL` and stores the base64 inside the localStorage blob. The code already knows this is a problem — there is a quota meter and a `QuotaExceededError` toast. Supabase Storage plus a table of pointers is the Phase 5 fix, and the schema can be ready for it now.

Two columns worth copying exactly: separate `taken_at` from `uploaded_at`. When a photo was taken and when it reached the server are different facts, and if a walkthrough is done in a unit with bad signal they can be hours apart. Only one of them is evidence.

### 5. `ical_url` on the property, and a `reservations` table

The biggest structural gap, and the one with the most direct payoff.

Airbnb and VRBO both publish a per-listing iCal feed URL. OpenSTR stores it on the property, syncs it, and writes rows with `checkin_date`, `checkout_date`, `external_uid` (the iCal event ID, so re-syncing updates rather than duplicates) and `is_blocked` (distinguishing an owner block from a real booking).

PropertyPulse currently has no idea when anyone is in the apartment. Every maintenance task it schedules is scheduled blind. With bookings in the database, "this filter is due" becomes "this filter is due and there is a four-day gap starting the 14th" — which is the actual decision being made. Their `min_turnaround_hours` column is the same idea applied to cleaning.

## Things PropertyPulse has that OpenSTR does not

Not padding — worth knowing so the gaps above read as a list of additions rather than a verdict.

OpenSTR has **no cost tracking at all**. No column named `cost` anywhere in its migrations or routes. PropertyPulse records cost per completion, which over three apartments and a few years is the number that answers "is this unit actually profitable" and "was that repair quoted fairly." That is a real feature they skipped.

It also has no **appliance registry** (brand, model, install year), no **`why` explanation** attached to each rule, and no concept of **preventive maintenance intervals** whatsoever. Its `issues` table is reactive — something broke, log it. Nothing in it predicts.

## On adopting their code

Don't. Beyond the GPL and the Docker-plus-Flutter operational weight, the repo is one person's unfinished side project: `api/src/db/seed-checklists.ts` queries `SELECT id FROM standards WHERE is_active = true`, but no migration ever creates an `is_active` column on `standards`. Their own seed script cannot run against their own schema. That is the level of polish to expect from the rest of it.

Read it, take the five ideas, write the SQL fresh.
