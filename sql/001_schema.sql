-- 001_schema.sql — the nine tables
-- Run: 2026-08. Status: applied.
--
-- Maps onto the app's state object in index.html: properties, appliances,
-- vendors, completions, custom_rules, requests, and walkthroughs +
-- walkthrough_items are the collections in blankState(). profiles holds the
-- owner's details and the digest preference.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text, email text, phone text,
  digest_enabled boolean default true,
  created_at timestamptz default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  nickname text not null, address text, type text,
  beds int, year_built int,
  baseline_date date not null,
  systems text[] default '{}',
  skipped_rules text[] default '{}',
  guest_code text unique default encode(gen_random_bytes(6),'hex'),
  created_at timestamptz default now()
);

create table appliances (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  kind text not null, brand text, model text, install_year int
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null, trades text[] default '{}',
  location text, email text, phone text, notes text
);

create table custom_rules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  name text not null, every_months int not null,
  trade text, why text
);

create table completions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  rule_id text not null,
  completed_on date not null,
  cost numeric, vendor_id uuid references vendors(id) on delete set null,
  note text, snoozed boolean default false
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  guest_name text not null, guest_email text not null,
  title text not null, body text, trade text,
  urgency text default 'normal',
  status text default 'new',
  owner_note text,
  created_at timestamptz default now()
);

create table walkthroughs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete set null,
  started date not null,
  completed date,
  status text default 'open',
  -- the token in the vendor's link, so they never see a database id
  access_code text unique default encode(gen_random_bytes(6),'hex')
);

create table walkthrough_items (
  id uuid primary key default gen_random_uuid(),
  walkthrough_id uuid references walkthroughs(id) on delete cascade,
  area text not null, label text not null,
  status text default '',          -- '' | ok | attention | na
  note text default '',
  photo_path text,                 -- Storage object path, not a data URL
  position int
);

create index on walkthrough_items (walkthrough_id, position);
