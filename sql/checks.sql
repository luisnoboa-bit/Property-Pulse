-- checks.sql — read-only. Never changes anything. Run any time.
--
-- Save this as a named snippet in the Supabase SQL editor ("RLS check") and
-- re-run it rather than opening a new query tab. Highlight one query and press
-- Cmd+Enter to run only that one.

-- 1. Is every table protected, and does every table have at least one policy?
-- Expect nine rows, rls_on = true on all nine, policies: requests = 3, rest = 1.
--
-- The dangerous middle state is rls_on = true with policies = 0: that denies
-- everyone including you, while the Table Editor still shows rows because the
-- dashboard connects with the service role key and bypasses RLS entirely.
select t.tablename,
       t.rowsecurity as rls_on,
       count(p.policyname) as policies
from pg_tables t
left join pg_policies p
  on p.schemaname = t.schemaname and p.tablename = t.tablename
where t.schemaname = 'public'
group by t.tablename, t.rowsecurity
order by t.tablename;


-- 2. What are the policies actually testing?
-- Run this on any table whose count above was higher than expected.
-- Look at qual: it should name auth.uid(). A qual of `true` means everyone,
-- and because permissive policies combine with OR, one loose policy overrides
-- a correct one sitting beside it.
select tablename, policyname, cmd, permissive, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;


-- 3. Row counts per table, for confirming a migration did what you expected.
select 'properties' as t, count(*) from properties
union all select 'completions', count(*) from completions
union all select 'appliances',  count(*) from appliances
union all select 'vendors',     count(*) from vendors
union all select 'custom_rules',count(*) from custom_rules
union all select 'requests',    count(*) from requests
union all select 'walkthroughs',count(*) from walkthroughs;


-- 4. Does every account have a profiles row?
-- Expect zero rows. Anything listed here signed up before 004 ran, or the
-- trigger is not firing. Every other table hangs off profiles.id, so an account
-- missing from here can log in and then fail on its first insert.
select u.id, u.email, u.created_at
from auth.users u
left join profiles p on p.id = u.id
where p.id is null;


-- 5. Is the signup trigger actually attached?
-- Expect one row: on_auth_user_created on users.
select tgname, tgrelid::regclass as on_table, tgenabled
from pg_trigger
where tgname = 'on_auth_user_created';
