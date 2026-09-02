-- 003_policy_cleanup.sql — remove redundant policies, guard completion history
-- Run: 2026-09-02. Status: pending.

-- Two extra policies on profiles came from the Supabase dashboard's policy
-- wizard rather than from 002. They are not a leak — all three policies on the
-- table, including these, test (auth.uid() = id), and permissive policies
-- combine with OR, so identical tests add nothing.
--
-- They are dropped anyway so the database matches this folder exactly.
-- 002 only drops and recreates own_profile, so re-running it would leave these
-- behind and the repo would stop describing the real schema.
--
-- Expected policy counts after this runs: requests = 3, every other table = 1.

drop policy if exists "read own profile" on profiles;
drop policy if exists "update own profile" on profiles;

-- completions.rule_id is text so it can hold either a built-in rule key from the
-- JS catalog or a custom rule's uuid. Postgres cannot enforce a foreign key
-- against two different sources, so deleting a custom rule would leave its
-- completions pointing at nothing — the history stays in the table but the app
-- reads the task as never done, with no error anywhere.
--
-- The guard is to archive instead of delete. Nothing in the app should ever run
-- `delete from custom_rules`.

alter table custom_rules add column if not exists archived boolean not null default false;
