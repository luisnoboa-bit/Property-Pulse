-- 002_rls.sql — row level security for all nine tables
-- Run: 2026-09-02. Status: applied.
--
-- Supersedes an earlier RLS attempt that covered seven of the nine tables;
-- profiles and custom_rules got neither an enable line nor a policy, which is
-- what showed as "RLS disabled" at setup checklist step 1.8.
--
-- Re-runnable. Safe to paste again after a partial or earlier run:
-- enabling RLS twice is a no-op, and each policy is dropped before it is recreated.

-- All nine tables. The two that get forgotten are profiles and custom_rules,
-- because they are the ones with no obvious "owner_id" column to write a policy about.
alter table profiles           enable row level security;
alter table properties         enable row level security;
alter table appliances         enable row level security;
alter table vendors            enable row level security;
alter table custom_rules       enable row level security;
alter table completions        enable row level security;
alter table requests           enable row level security;
alter table walkthroughs       enable row level security;
alter table walkthrough_items  enable row level security;

-- your own profile row, nobody else's.
-- `for all` with only a using clause applies the same test to inserts, which is
-- what lets the app create this row at signup without a second insert policy.
drop policy if exists own_profile on profiles;
create policy own_profile on profiles
  for all using (auth.uid() = id);

-- owners see only their own properties
drop policy if exists own_properties on properties;
create policy own_properties on properties
  for all using (auth.uid() = owner_id);

drop policy if exists own_vendors on vendors;
create policy own_vendors on vendors
  for all using (auth.uid() = owner_id);

-- child tables inherit access through the parent property
drop policy if exists own_appliances on appliances;
create policy own_appliances on appliances
  for all using (exists (
    select 1 from properties p
    where p.id = appliances.property_id and p.owner_id = auth.uid()));

drop policy if exists own_custom_rules on custom_rules;
create policy own_custom_rules on custom_rules
  for all using (exists (
    select 1 from properties p
    where p.id = custom_rules.property_id and p.owner_id = auth.uid()));

drop policy if exists own_completions on completions;
create policy own_completions on completions
  for all using (exists (
    select 1 from properties p
    where p.id = completions.property_id and p.owner_id = auth.uid()));

-- owners see all requests on their properties
drop policy if exists owner_reads_requests on requests;
create policy owner_reads_requests on requests
  for all using (exists (
    select 1 from properties p
    where p.id = requests.property_id and p.owner_id = auth.uid()));

-- guests: anyone with a valid property link may file a request,
-- but may only read back the ones they filed themselves.
-- NOTE: `with check (true)` is genuinely open. It cannot leak data, but anyone
-- holding the anon key can insert against any property_id. Tighten in Phase 4.
drop policy if exists guest_inserts on requests;
create policy guest_inserts on requests
  for insert with check (true);

drop policy if exists guest_reads_own on requests;
create policy guest_reads_own on requests
  for select using (guest_email = current_setting('request.jwt.claims',true)::json->>'email');

-- walkthroughs: the owner has full access through the property
drop policy if exists owner_walkthroughs on walkthroughs;
create policy owner_walkthroughs on walkthroughs
  for all using (exists (
    select 1 from properties p
    where p.id = walkthroughs.property_id and p.owner_id = auth.uid()));

drop policy if exists owner_walk_items on walkthrough_items;
create policy owner_walk_items on walkthrough_items
  for all using (exists (
    select 1 from walkthroughs w join properties p on p.id = w.property_id
    where w.id = walkthrough_items.walkthrough_id and p.owner_id = auth.uid()));
