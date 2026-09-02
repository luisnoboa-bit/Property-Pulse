-- 004_profile_trigger.sql — create the profiles row automatically at signup
-- Run: 2026-09-02. Status: pending.

-- Every other table hangs off profiles.id via owner_id, so an account with no
-- profiles row can sign in and then fail on the first insert. Doing it from the
-- app instead would mean the row only exists if that one call succeeded, and a
-- closed tab between signup and insert leaves a broken account behind. A trigger
-- runs inside the same transaction as the signup: both happen or neither does.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
-- security definer runs this as the function's owner rather than as whoever
-- triggered it. It is required here: at signup the caller is still the anon
-- role and auth.uid() is null, so the own_profile policy from 002 would block
-- the insert. This is the intended use of security definer, not a workaround.
security definer
-- Pinning search_path is mandatory on any security definer function. Without
-- it, someone who can create objects could put their own `profiles` earlier on
-- the path and have it written to with owner privileges.
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  -- Signup should never fail because a profile already exists. It can, if this
  -- trigger is added after accounts were created by hand in the dashboard.
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: any account that already exists gets its profiles row now, so this
-- file leaves the database in the same state whether it ran before or after the
-- first signup.
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
