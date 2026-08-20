# PropertyPulse setup checklist

A step by step path from the file on your computer to a live app that emails you when maintenance is past due.

Work through it in order. Every phase ends with something that works, so you can stop after any of them and still have a functioning thing. Do not try to do it all in one sitting.

**Before you start, one honest expectation.** Phases 0, 1 and 3 through 7 are mostly clicking buttons in a dashboard and pasting things I give you. Phase 2 is real programming, and it is the bulk of the work. You do not have to write it alone, that is what our sessions are for, but no checklist can turn it into a button. Budget your energy accordingly.

## Your three apps, and what each one is for

You installed the right things. They are not three ways of doing the same job, they are three parts of one loop.

**VS Code is where you change things.** It is the text editor. You open the project folder once and it stays open. It colours the code, points out typos before you run anything, and has a built in terminal you will need in Phase 6.

**GitHub Desktop is the save button that reaches the outside world.** After you edit and save in VS Code, GitHub Desktop notices, shows you exactly which lines changed in green and red, and lets you write a sentence describing why. That is a commit. Then you push, which uploads it. The value of the green and red view is that you see what you are about to publish before you publish it, which catches a surprising number of mistakes.

**GitHub.com is the copy that lives online.** It is your backup, the thing recruiters read, and, importantly, the thing Netlify watches. Netlify redeploys your live site automatically every time you push.

So the loop, once set up, is four steps and takes about a minute:

```
edit in VS Code  ->  save  ->  commit and push in GitHub Desktop  ->  Netlify redeploys
```

You will do this loop dozens of times. It is worth doing it once in Phase 0 on something trivial, like fixing a word, purely to feel it work end to end before anything is at stake.

Two words that trip people up. **Commit** means "record this change with a note about why", and it only affects your computer. **Push** means "send my commits up to GitHub", and that is the one that makes the live site update. GitHub Desktop shows both as buttons in the same place, so it is easy to commit and then wonder why nothing happened. You forgot to push.

| Phase | What you get | Time | Difficulty |
|---|---|---|---|
| 0 | A live URL you can send to recruiters today | 45 min | Easy |
| 1 | An empty database with your tables and security rules | 45 min | Easy, mostly pasting |
| 2 | Your phone and laptop sharing the same data | 6 to 10 hrs | Hard, do this with me |
| 3 | Logins, so it is actually your account | 1 hr | Medium |
| 4 | A guest link tenants can use | 1 hr | Medium |
| 5 | Real photos instead of thumbnails | 2 hrs | Medium |
| 6 | The Monday morning past-due email | 2 to 3 hrs | Hard |
| 7 | Keeping the project awake | 20 min | Easy |

---

## Phase 0: get it online today

This gets you a shareable link with the demo working, before any database exists. Do it first. It is a real milestone and it takes half an hour.

### Set up the three apps

- [ ] **0.1** Open GitHub Desktop. Sign in to your GitHub account under **File**, then **Options**, then **Accounts**. Sign in to the same account in your browser too.
- [ ] **0.2** Still in **Options**, open **Integrations** and set the external editor to **Visual Studio Code**. This puts an "Open in Visual Studio Code" button on the main screen, which is how you will jump between the two apps.
- [ ] **0.3** Go to github.com, click the **+** in the top right, then **New repository**. Name it `propertypulse`. Set it to **Public** so recruiters can read the code. Tick **Add a README file**. Click **Create repository**.
- [ ] **0.4** Back in GitHub Desktop, click **File**, then **Clone repository**. Pick `propertypulse` from the list. Note the **Local path** it offers, something like `Documents/GitHub/propertypulse`, and click **Clone**. Cloning means it made a folder on your computer that stays linked to the one online.

### Put the app in it

- [ ] **0.5** Open that folder in Finder or File Explorer and copy in `propertypulse.html`, `tests.js`, `DEPLOYMENT-GUIDE.md` and this checklist. The tests are part of what makes this impressive to a hiring manager, so do not leave them out.
- [ ] **0.6** Rename `propertypulse.html` to `index.html`. A web host serves a file called `index.html` by default, so this is what makes the bare URL work rather than requiring `/propertypulse.html` on the end.
- [ ] **0.7** Switch to GitHub Desktop. All four files should now be listed on the left with a green plus. If the folder looks empty to it, you copied the files somewhere other than the cloned folder.
- [ ] **0.8** In the box at the bottom left, type a summary: `Add working prototype`. Click **Commit to main**. Then click **Push origin** at the top. Both steps are needed.
- [ ] **0.9** Refresh your repository page on github.com and confirm the files are there.

### Put it online

- [ ] **0.10** Go to app.netlify.com. Click **Add new site**, then **Import an existing project**, then **GitHub**. Authorise Netlify if it asks.
- [ ] **0.11** Pick your `propertypulse` repository. Leave the build command empty and the publish directory as `/`. There is no build step, this is one HTML file. Click **Deploy**.
- [ ] **0.12** Wait about a minute. You will get a URL like `random-words-123.netlify.app`. Open it on your phone.
- [ ] **0.13** In Netlify, go to **Site configuration**, then **Change site name**, and set something like `propertypulse-luis`. Now your link is `propertypulse-luis.netlify.app`.
- [ ] **0.14** Click the demo button on the live site. Confirm the sample property, the schedule, the walkthroughs and the vendor search all work on a phone screen.

### Practise the loop before it matters

- [ ] **0.15** In GitHub Desktop, click **Open in Visual Studio Code**. The whole project folder opens in the editor, with the file list down the left.
- [ ] **0.16** Open `README.md` and write one sentence about what the project is. Save with Ctrl+S or Cmd+S. VS Code marks unsaved files with a dot next to the filename, and an unsaved file is invisible to GitHub Desktop, which is the single most common source of "why did nothing change".
- [ ] **0.17** Switch to GitHub Desktop. Your sentence appears in green. Commit with the summary `Describe the project`, then push.
- [ ] **0.18** Watch the **Deploys** tab in Netlify. Within a minute it builds and publishes on its own. Nothing else to click.

**You now have a portfolio link.** Send it to recruiters today. Everything below is for you, not for them.

---

## Phase 1: the database

- [ ] **1.1** At supabase.com/dashboard, click **New project**. Name it `propertypulse`. Pick the region closest to you, since it affects how fast the app feels.
- [ ] **1.2** Set a database password. **Save it in your password manager now.** It is shown once and recovering it later is a nuisance.
- [ ] **1.3** Wait two or three minutes while it provisions.
- [ ] **1.4** Open the **SQL Editor** in the left sidebar. Click **New query**.
- [ ] **1.5** Copy the entire schema block from `DEPLOYMENT-GUIDE.md` under **Database schema**, paste it, and click **Run**. You should see "Success. No rows returned", which is correct for statements that create things.
- [ ] **1.6** New query again. Paste the **Row level security** block from the same guide. Run it.
- [ ] **1.7** Open **Table Editor** in the sidebar and confirm you see nine tables: `profiles`, `properties`, `appliances`, `vendors`, `custom_rules`, `completions`, `requests`, `walkthroughs`, `walkthrough_items`.
- [ ] **1.8** Go to **Authentication**, then **Policies**. Confirm every table shows policies and none says "RLS disabled". A table with RLS off is readable by anyone who has your URL.
- [ ] **1.9** Go to **Project Settings**, then **API**. Copy two things into your notes:
  - **Project URL**, looks like `https://abcdefgh.supabase.co`
  - **anon public key**, a long string. Newer projects may label this the **publishable key**.
- [ ] **1.10** On the same page there is a **service_role** key, sometimes called the secret key. **Never put this one in your HTML file or in GitHub.** It ignores all your security rules by design. It is only for Phase 6, where it lives in a server side setting. If it ever ends up in a public repo, rotate it immediately.

The anon key is different and is safe to publish. It is designed to sit in browser code, and the row level security policies are what actually protect the data. That is the whole reason we chose a database with RLS.

---

## Phase 2: connecting the app to the database

This is the real work. Right now every read and write in the app goes through one object called `DB` that talks to browser storage. The plan is to replace the inside of that object with Supabase calls and leave the other 2,000 lines alone.

Do this phase with me in a working session rather than from a checklist. What it involves:

- [ ] **2.0** First, two small things in VS Code that will save you pain. Install the **Live Server** extension from the Extensions panel on the left, the icon with four squares. Right clicking `index.html` then **Open with Live Server** runs the app locally so you can test changes without pushing them to the live site. Second, create a file called `.gitignore` in the project folder containing one line, `.env`. That is an instruction to never upload secrets, and Phase 6 is where you would otherwise be tempted to.
- [ ] **2.1** Split `index.html` into `index.html`, `app.js` and `styles.css`. One file was right for a prototype you email around. It stops being right the moment you need to load a library. VS Code makes this manageable: it will tell you when a function has gone missing rather than letting you find out from a blank page.
- [ ] **2.2** Add the Supabase client library and initialise it with the Project URL and anon key from step 1.9.
- [ ] **2.3** Replace `DB.load` and `DB.save` with per table reads and writes. This is the part that takes hours, because saving everything at once stops working. Right now the app rewrites its whole state on every change, which is fine locally and wasteful over a network.
- [ ] **2.4** Make every function that touches data `async` and await it. Miss one and you get a blank screen with no error, which is the most common way this migration goes wrong.
- [ ] **2.5** Add a loading state. Local storage is instant, a network is not, and without this the app flashes empty on every load.
- [ ] **2.6** Keep demo mode working entirely in browser storage, with no database calls at all. Recruiters must never need an account, and demo traffic should never touch your real data.
- [ ] **2.7** Run the 139 tests. Expect the photo and persistence tests to need adjusting, since they assert data URLs and synchronous storage. Everything else should pass untouched, and anything else that fails is a real bug you just introduced.

**Checkpoint:** add a property on your laptop, open the site on your phone, and see it there.

---

## Phase 3: logins

- [ ] **3.1** In Supabase, go to **Authentication**, then **Providers**. Confirm **Email** is enabled.
- [ ] **3.2** Turn on **Confirm email** so addresses are verified. This matters later, because the guest policy trusts the email in the login token.
- [ ] **3.3** Go to **Authentication**, then **URL Configuration**. Set **Site URL** to your Netlify address. Add it to **Redirect URLs** too. If you skip this, login emails send people to `localhost` and nothing works.
- [ ] **3.4** Add a sign in screen to the app: email in, magic link out, no passwords.
- [ ] **3.5** Create a row in `profiles` when someone signs up for the first time, and store their `id` as `owner_id` on everything they create.
- [ ] **3.6** Sign up as yourself. Check **Authentication**, then **Users**, and confirm you appear.
- [ ] **3.7** **Test the security properly.** Open your site in a private window and sign up with a second, throwaway email. Confirm that account sees nothing at all: no properties, no vendors, no walkthroughs. If it sees your data, stop and fix the policies before going further. Do not skip this step, it is the one that decides whether sharing the app is safe.

---

## Phase 4: the guest portal

- [ ] **4.1** Each property already gets a `guest_code` automatically from the schema. Find yours in the **Table Editor** under `properties`.
- [ ] **4.2** Wire the guest link so `yoursite.netlify.app/#guest/<guest_code>` opens the request form for that property. The routing already exists in the app, it just needs to look up the code instead of the raw ID.
- [ ] **4.3** Have the guest enter their email and receive a magic link, the same as you. No passwords for tenants, they will not do it.
- [ ] **4.4** Test as a guest: submit a request from your phone, on a different email, and confirm it appears in your owner dashboard.
- [ ] **4.5** Confirm the guest can see their own request and nothing else. Submit a second request from a third email and check that neither guest can see the other's.

---

## Phase 5: real photos

- [ ] **5.1** In Supabase, go to **Storage** and click **New bucket**. Name it `walkthrough-photos`. Leave it **private**, not public.
- [ ] **5.2** Add a storage policy so an owner can read and write only inside folders belonging to their own properties. Storage does not inherit your table policies, this is separate.
- [ ] **5.3** Change photo upload to store the full size original in Storage at `{property_id}/{walkthrough_id}/{item_id}.jpg` and keep the small compressed version in the row for list views.
- [ ] **5.4** Load thumbnails in the checklist grid, and fetch a signed URL only when someone opens a photo. Signed URLs expire, so a leaked link does not become permanent access to the inside of a property.
- [ ] **5.5** Watch the bar. The free tier is 500 MB, which is roughly 1,600 photos or 100 walkthroughs.

---

## Phase 6: the past due email

This is the feature that fixes the actual problem with your spreadsheet, so it is worth the effort even though it is the fiddliest phase.

- [ ] **6.1** Sign up at resend.com. Free, 3,000 emails a month, no card.
- [ ] **6.2** Verify a sending domain if you own one. If you do not, use Resend's test sending address for now. Test addresses only deliver to your own verified email, which is fine while it is only you receiving the digest.
- [ ] **6.3** Copy your Resend API key.
- [ ] **6.4** Check whether your Supabase dashboard has an **Edge Functions** section that lets you create a function in the browser. If it does, use it and skip the next step. If it only shows CLI instructions, you need the command line.
- [ ] **6.5** Command line path: install Node.js from nodejs.org, then open the terminal inside VS Code with **Terminal**, then **New Terminal**. It opens already pointed at your project folder, which saves you navigating there. Run `npx supabase login`, then `npx supabase link --project-ref YOUR_PROJECT_REF`. The project ref is the random part of your Supabase URL.
- [ ] **6.6** Create the `weekly-digest` function using the code in `DEPLOYMENT-GUIDE.md`. The schedule building logic is copied from the app unchanged, which is deliberate: the email must agree with the dashboard, and two implementations would eventually disagree.
- [ ] **6.7** Add secrets: `RESEND_API_KEY` in the function's environment settings. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually provided automatically. These live on the server and never touch your public code.
- [ ] **6.8** Deploy the function, then invoke it manually once and read the logs. Fix what breaks before automating it. Debugging something that only runs on Mondays is miserable.
- [ ] **6.9** In the SQL Editor, enable the `pg_cron` and `pg_net` extensions, then run the `cron.schedule` block from the guide.
- [ ] **6.10** Test the schedule by temporarily setting the cron to `* * * * *`, which is every minute. Confirm the email arrives, then change it back to `0 7 * * 1` for Monday at 7am. Do not forget this step or you will send yourself 10,000 emails.
- [ ] **6.11** Add a second trigger on new guest requests, so an urgent issue reaches you immediately instead of waiting for Monday.

---

## Phase 7: keeping it awake

Supabase pauses free projects after seven days with no activity, and a paused project cannot wake itself. Your weekly digest cannot rescue it either, because the scheduler needs the database already running. This is 20 minutes and it is not optional.

- [ ] **7.1** In VS Code, create a new file and save it as `.github/workflows/keepalive.yml` inside the project folder. Typing the slashes in the save dialog creates the folders for you. The leading dot means the folder is hidden in Finder or File Explorer, which is normal and not a mistake.
- [ ] **7.2** Paste the keepalive workflow from `DEPLOYMENT-GUIDE.md`. Save, then commit and push in GitHub Desktop. YAML cares about indentation, so if GitHub later says the workflow is invalid, that is almost always a paste that lost its spacing.
- [ ] **7.3** Go to repository **Settings**, then **Secrets and variables**, then **Actions**. Click **New repository secret** twice: `SUPABASE_URL` and `SUPABASE_ANON_KEY`, with the values from step 1.9. Use the anon key here, never the service role key.
- [ ] **7.4** Open the **Actions** tab, pick the keepalive workflow, and click **Run workflow** to test it by hand. A green tick means it worked.
- [ ] **7.5** Put a reminder in your calendar for four weeks out to confirm it is still running green. Scheduled workflows on inactive repositories can get disabled, which would silently undo all of this.

---

## Phase 8: finishing touches

- [ ] **8.1** Write the repository README using the five points at the end of `DEPLOYMENT-GUIDE.md`: the problem, the rules-as-data decision, the scheduling judgment call, and the two bugs the tests caught. This is what a hiring manager actually reads.
- [ ] **8.2** Put a screenshot or a short screen recording at the top of the README. Most people decide in ten seconds whether to click through.
- [ ] **8.3** Add your real properties, appliances and vendors. This is the point of the whole thing.
- [ ] **8.4** Use it on your phone for a month before adding anything new. You will discover the real gaps faster that way than by planning.
- [ ] **8.5** Decide about WhatsApp only after that month. It is the one piece that costs money, roughly $5 to $15 a month, and email may well turn out to be enough.

---

## If something goes wrong

**I edited a file but GitHub Desktop shows no changes.** Either the file is unsaved, look for a dot next to the filename in VS Code, or you edited a copy outside the cloned folder. GitHub Desktop only watches the one folder it created.

**I committed but the live site did not update.** You did not push. Commit records the change on your computer, push sends it up, and only push triggers Netlify.

**GitHub Desktop says the changes are on a different branch.** Use the branch dropdown at the top and switch back to `main`. Netlify only deploys `main` unless you tell it otherwise.

**The site shows a blank white page.** Open the browser console with F12 and read the first red error. A blank page after Phase 2 is almost always a missing `await`.

**Login emails never arrive.** Check spam, then check **Authentication**, then **URL Configuration**. A wrong Site URL is the usual cause. Supabase also rate limits its built in email sender to a handful an hour, which looks exactly like being broken.

**"row violates row-level security policy".** This is the security working, not a bug. It means you are writing a row whose `owner_id` does not match the signed in user.

**The other account can see my data.** Stop and fix it before sharing anything. Usually a table where RLS was never enabled, so check the **Policies** page for anything marked disabled.

**Everything worked and now nothing loads.** Check whether the Supabase project is paused. If it is, restore it from the dashboard, then check why the keepalive stopped.
