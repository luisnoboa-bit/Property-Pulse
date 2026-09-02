# PropertyPulse: how to get this online for free

You have a working prototype. This guide covers the two things it cannot do yet, and exactly what it costs.

## What works right now

Open `propertypulse.html` in any browser. Everything functions: setup wizard, schedule generation, vendor matching, find-a-local search when a trade is not covered, guest requests, walkthrough checklists with photos and notes, CSV export, mobile layout. Data saves to your browser automatically.

What it cannot do yet is the part that actually solves your problem. Data lives in one browser on one device, so your phone and laptop do not share a schedule. Guests cannot reach it because there is no URL. Neither can the vendor you assigned a walkthrough to, so the copy-link button only works on your own machine for now. And nothing emails you when something goes past due, which is the whole reason your spreadsheet fails.

Fixing those things is phase 2.

## The honest cost breakdown

| Piece | Service | Free tier | Enough for you? |
|---|---|---|---|
| Hosting | Netlify or Cloudflare Pages | Netlify 300 credits/month, roughly 15 GB. Cloudflare unlimited | Yes, by a wide margin |
| Database + logins | Supabase | 500 MB database, 50k monthly users, 5 GB egress | Yes, but see the pause problem below |
| Walkthrough photos | Supabase Storage | 500 MB, roughly 1,600 photos | Yes |
| Scheduled digest | Supabase cron | 2 million function calls/month | Yes |
| Email delivery | Resend | 3,000 emails/month | Yes |
| Vendor search | Google search URL | Free, no API key | Yes. Places API is the paid alternative |
| Domain (optional) | Netlify subdomain | Free | `propertypulse.netlify.app` works fine |
| **WhatsApp** | Twilio or Meta BSP | **None** | **No. Roughly $5 to $15/month** |

Everything except WhatsApp is genuinely free at your volume, and stays free. The one asterisk is that Supabase pauses free projects after a week of no activity, and it cannot wake itself up. That needs a small fix, described in the next section.

### About WhatsApp

You picked WhatsApp, so here is the situation plainly. Meta does not offer a free WhatsApp API. You need a Business Solution Provider like Twilio, which charges per conversation on top of a small monthly minimum. Realistically $5 to $15 a month for your volume.

Two things worth knowing before you spend it. First, WhatsApp requires pre-approved message templates for anything you send outside a 24 hour reply window, and a maintenance digest counts as outside. Getting a template approved takes a few days. Second, email plus a phone notification covers most of the same ground for nothing.

My suggestion is to ship with email, live with it for a month, and see whether you actually miss WhatsApp. The notification layer is built so adding it later is a small change rather than a rewrite. If you still want it, that is a half day of work.

## The pause problem, and why it matters more here than for most apps

Supabase pauses free projects after seven days with no API requests, no database queries, and no Edge Function invocations. When paused the database goes offline, pg_cron stops running, and Edge Functions become unreachable until you manually restore it from the dashboard.

For most side projects this is a shrug. For this one it aims directly at the thing you are building.

A property maintenance tracker is, by design, an app you do not open for weeks at a time. That is the entire value proposition: it watches so you do not have to. So the natural usage pattern of this app is exactly the pattern that triggers the pause. And the consequences land on the three things you asked for:

The weekly digest stops firing, which is the feature that fixes your spreadsheet problem. Worse, the digest cannot rescue itself. pg_cron needs the database already running, so it cannot be the thing that keeps the database running. The guest portal breaks silently. Netlify still serves the page, because that is static, so a guest fills in the form and gets an error on submit rather than an obvious "site is down". Same for a vendor opening a walkthrough link, which is likely to be the first time they ever use the tool, on a phone, standing in a property.

The fix is small and free. Have something outside Supabase ping the project on a schedule. A GitHub Actions workflow on a cron hitting your REST endpoint, or any free uptime pinger, resets the inactivity timer. Once every few days is plenty against a seven day window.

```yaml
# .github/workflows/keepalive.yml
name: keepalive
on:
  schedule:
    - cron: '0 9 * * 1,4'   # Monday and Thursday, well inside the 7 day window
  workflow_dispatch:         # so you can also trigger it by hand
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -sSf -o /dev/null \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            "${{ secrets.SUPABASE_URL }}/rest/v1/properties?select=id&limit=1"
```

Two runs a week rather than one gives you a spare. If a single run fails while you are away, you have not burned the whole window.

Treat this as required, not optional. It is the difference between an app that notifies you and an app that quietly stopped a month ago, which is the failure mode you already have with the spreadsheet.

If you would rather not depend on a keep-alive hack at all, that is a legitimate reason to look at a different backend, and the tradeoffs are in the next section.

## Why these two, and what else you could use

Worth separating, because the two picks are not equally considered.

**Netlify was close to arbitrary.** You are deploying one HTML file with no build step. Netlify, Cloudflare Pages, GitHub Pages, Vercel and Render all do that for free, in about the same three minutes, and switching later means re-pointing a repository. There is no lock-in to worry about. The one thing that has changed since Netlify became the default recommendation is that accounts created after September 2025 use a credits model rather than the old flat 100 GB, so a new signup gets 300 credits a month with bandwidth billed at 20 credits per GB, or roughly 15 GB. Still far more than a 100 KB page needs, but Cloudflare Pages gives unlimited bandwidth on every tier including free, and limits builds instead at 500 a month, which you will never approach. If you have not signed up for anything yet, Cloudflare Pages is the marginally better default. If you already have a legacy Netlify account, keep it.

**Supabase was a real decision**, and the reason is the guest portal. You want strangers to submit maintenance requests and see their own request, without seeing anyone else's property, vendors or costs. Normally that means writing and hosting a backend API, which is a server, which is not free. Postgres Row Level Security lets the database itself enforce that rule, so the browser can talk to the database directly and a guest physically cannot read rows that are not theirs, even if they open dev tools and craft their own query. Supabase bundles RLS with magic-link auth, file storage for walkthrough photos, and cron, which is four of your requirements from one free tier. Your data is also genuinely relational: properties own appliances, appliances drive rules, rules produce completions, walkthroughs contain items. Postgres is the right shape for that.

The honest alternatives, and why I would still stay put:

**Cloudflare D1 plus Workers** is the strongest contender. No pause, no cold-start penalty, one platform if you are already on Pages, and a generous free tier. The catch is that D1 is SQLite with no row level security and Cloudflare has no built-in auth. Every authorization rule you get free from RLS becomes code you write in a Worker and are responsible for getting right. That is the exact work Supabase was chosen to avoid, and authorization bugs are the kind that do not announce themselves.

**Firebase or Firestore** also never pauses and has excellent auth. But Firestore is document based, so the joins this app does constantly become denormalized copies you have to keep in sync by hand, and its security rules are harder to reason about than SQL policies. It is a worse fit for relational data, not a worse product.

**Neon** is real Postgres with generous free compute and no manual restore. It has no built-in auth, no file storage and no cron, so you would be assembling three services instead of using one.

**PocketBase** self-hosted gives you everything in a single binary and is a joy to work with, but it needs a server to run on, and a server is not free. That disqualifies it here.

So: stay on Supabase, add the keepalive workflow above and treat it as part of the deployment rather than a nice-to-have. Swap Netlify for Cloudflare Pages if you have not created an account yet. Revisit only if you outgrow the free tier, at which point you have a real product and the calculation is different.

One caveat on the numbers in this guide. Free tiers change often and the figures above came from search results rather than a direct read of the pricing pages, which were not reachable from this session. Confirm the current limits on each provider's pricing page before you commit, particularly the Supabase pause window and Netlify's credit allowance.

## Database schema

Nine tables. This mirrors the prototype's data shapes exactly, so the migration is mostly find and replace.

One thing that is not obvious from reading the SQL: `walkthrough_items` stores a flat copy of the checklist rather than pointing at a shared template. That looks like duplication, and it is on purpose. A walkthrough is a record of what someone saw on a specific day. If you later add an item to the template or reword one, every historical report would silently change to describe an inspection that never happened that way. Copying the checklist at creation time is what makes an old report still mean something.

```sql
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
```

### Row level security

This is the part that makes sharing safe. Without it, anyone with your URL can read every property in the database.

```sql
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
```

This block is safe to run more than once. Enabling row level security on a table that already has it is a no-op, and each policy is dropped before it is recreated, so re-running after a partial attempt will not error with "policy already exists".

Enabling RLS and having a policy are two separate switches, and the dangerous middle state is RLS on with no policy: that denies everyone, including you, while the Table Editor keeps showing rows because the dashboard uses the service role key and bypasses RLS entirely. That is why the enable lines and the policies belong in one block rather than two. Run this to confirm you are not in that middle state:

```sql
-- Verification. Expect nine rows, rls_on = true on every one, policies >= 1.
-- A table with policies = 0 and rls_on = true is locked to everyone.
-- A table with rls_on = false is readable AND writable by anyone with your anon key.
select t.tablename,
       t.rowsecurity as rls_on,
       count(p.policyname) as policies
from pg_tables t
left join pg_policies p
  on p.schemaname = t.schemaname and p.tablename = t.tablename
where t.schemaname = 'public'
group by t.tablename, t.rowsecurity
order by t.tablename;
```

The assigned vendor is the awkward case. They have no account, so `auth.uid()` is null for them and every policy above denies. Do not solve this by loosening the policies. Route vendor writes through an Edge Function that takes the `access_code` from the link, uses the service role key to look up that one walkthrough, and writes only to its items. The vendor never gets a database credential, the code only unlocks a single walkthrough, and you can expire it by nulling the column once the walkthrough is complete.

Test these policies before you share the link. The quickest check is to open your live site in a private window, sign in as a throwaway second account, and confirm you cannot see the first account's property.

## Guest access

Do not require guests to create passwords. A tenant reporting a broken A/C will not sign up for an account.

Use Supabase magic links instead. The guest enters their email, gets a one-click sign-in link, and lands back in the portal. It is free, it needs no password, and it gives you a verified email address so the `guest_reads_own` policy above works.

Each property gets a `guest_code`, so the link you share looks like `yoursite.netlify.app/#guest/a3f9c2b1e4d7`. That code identifies the property without exposing its database ID. The prototype already routes on that hash, so this is a lookup change rather than new routing.

## Walkthrough photos

The prototype shrinks every photo to an 800px JPEG and stores it as a data URL in the browser. That was forced on it: browser storage caps around 5 MB and a phone photo is 3 to 5 MB, so one full-size picture would break the app. It works, but it means the owner never gets to see detail, and the photos are trapped in one browser.

Supabase Storage fixes both. Free tier is 500 MB, which at roughly 300 KB per photo is about 1,600 photos. A 47 item walkthrough where you photograph a third of the items is roughly 15 photos, so that is on the order of 100 walkthroughs before you need to think about it. Delete or archive old ones and it never becomes an issue.

```
Bucket: walkthrough-photos (private, not public)
Path:   {property_id}/{walkthrough_id}/{item_id}.jpg
```

Keep the client-side compression, but change what it produces. Upload the full-size original to Storage and keep a small thumbnail in the row for list views. The checklist grid then loads thumbnails, and clicking one fetches a signed URL for the original. Signed URLs expire, so a leaked link does not become permanent access to the inside of the property.

One caveat worth knowing before you build it: Storage does not inherit your table policies. You write a separate policy on `storage.objects`, and the vendor upload path has the same no-account problem as the item writes, so it goes through the same Edge Function.

## Upgrading the vendor search

The find-a-local button builds a Google search URL. That is deliberate: it costs nothing, needs no API key, and drops the user somewhere they can judge reviews themselves.

Google Places API would let you show name, rating, and phone inline instead. It is not free. Google gives a monthly credit that covers low volume, but it requires a billing card on file, and a loop that accidentally queries on every render can run up a real bill. If you add it, cache results per trade and location and never call it during a render.

The honest read is that the search link solves the problem. Reach for Places only if you find yourself repeatedly copying vendors back into the directory by hand.

## The digest function

This is the piece that fixes your actual problem. A Supabase Edge Function runs every Monday at 7am, recomputes every schedule, and emails owners anything overdue or due within 30 days.

```ts
// supabase/functions/weekly-digest/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async () => {
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // bypasses RLS, server side only
  )

  const { data: props } = await db
    .from('properties')
    .select('*, profiles(email, digest_enabled), completions(*)')

  for (const p of props ?? []) {
    if (!p.profiles?.digest_enabled) continue

    // buildSchedule() ported from the prototype, unchanged logic
    const sched = buildSchedule(p)
    const overdue = sched.filter(t => t.status === 'overdue')
    const soon    = sched.filter(t => t.status === 'soon')
    if (!overdue.length && !soon.length) continue

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PropertyPulse <alerts@yourdomain.com>',
        to: p.profiles.email,
        subject: overdue.length
          ? `${overdue.length} maintenance items past due at ${p.nickname}`
          : `${p.nickname}: ${soon.length} items coming up`,
        html: renderDigest(p, overdue, soon),
      }),
    })
  }
  return new Response('ok')
})
```

Schedule it with pg_cron:

```sql
select cron.schedule(
  'weekly-digest', '0 7 * * 1',
  $$ select net.http_post(
       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/weekly-digest',
       headers := '{"Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb
     ) $$
);
```

Also add a second trigger that fires on new guest requests, so an urgent issue reaches you immediately rather than waiting for Monday.

## Build order

Do these in sequence. Each step leaves you with something that still works.

1. Create Supabase and Netlify accounts, both free, no card required.
2. Run the schema and RLS policies in the Supabase SQL editor.
3. Split the prototype into separate files and swap the `DB` object for Supabase client calls. Everything else in the app stays as written, because all storage already routes through that one object.
4. Add email and magic-link auth.
5. Deploy to Netlify by connecting a GitHub repo. Every push redeploys automatically.
6. Add the digest function and cron schedule. Test it by temporarily setting the cron to every minute.
7. Add the guest portal route and confirm RLS holds against a second test account.
8. Move walkthrough photos to Storage and add the vendor access-code function.
9. Optional: add WhatsApp once you know you want it.

Steps 1 and 2 are about an hour. Step 3 is the bulk of the work.

## Sharing with recruiters

Send them the root URL. The landing page has a demo button that loads the sample property with no signup, so they see a working product within one click. That matters more than it sounds, because most people will not create an account to evaluate your portfolio.

Worth putting in the repo README, since this is what a hiring manager actually reads:

- **The problem.** Framed as you described it, reactive scheduling from a phone, a spreadsheet that goes stale, no past-due alerting.
- **The design decision you are most likely to be asked about.** The rules catalog is data, not code. Adding a maintenance type is one object in an array, and the onboarding answers act as feature flags against it. That is why the same app handles a condo and a house with a septic system without branching logic.
- **A judgment call you made.** For tasks with no completion history, the app schedules them forward instead of marking them overdue, because claiming something is "426 days overdue" when you have no record of when it was last done is inventing data. A new user should see a plan, not a wall of red.
- **A bug you caught.** Dates entered as `2026-08-04` were parsed as UTC and rendered a day early for anyone west of Greenwich. Caught by a test that ran the schedule across five timezones.
- **A second one, if they want depth.** The date shortcut buttons silently stopped working because the target selector `id="cdue"` was interpolated into another attribute. The inner quotes closed the attribute early and the browser parsed `data-quick="id="` plus garbage without erroring. Nothing threw, the button just did nothing. Fixed by having the buttons resolve their input through the DOM instead of a string selector.

Those last two are worth including. Interviewers respond well to a specific bug found by a specific test, and it shows you test rather than eyeball.

## Test suite

The prototype ships with 139 automated browser tests covering the wizard, schedule math, guest round-trip, walkthrough checklist and photo compression, vendor gap fallback, date pickers, storage limits, persistence, mobile layout, and timezone handling. Two standalone scripts sit alongside them: `verify.js` recomputes every due date independently of the app's own code, and `tz.js` runs the whole schedule in five timezones.

Keep all three running as you migrate. If a test that passed against localStorage fails against Supabase, the migration broke something real.

A few will need adjusting rather than fixing, and it is worth knowing which in advance. The photo tests assert a data URL, which becomes a Storage path. The persistence tests reload the page and read `localStorage`, which becomes a network round-trip and needs an await. Everything else, particularly the schedule math and the per-property checklist generation, should pass untouched, because that logic never knew where the data came from.
