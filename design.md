# PropertyPulse — Design Guide

**Status:** Living document · **Last updated:** 2026-10-26
**Applies to:** `index.html` (owner app, landing, login, guest portal, vendor walkthrough link)

---

## 1. The feel in one sentence

PropertyPulse should feel like a **quiet, well-organized notebook**: mostly white, near-black text, soft grey lines, and colour used only when it means something (something is overdue, done, or needs you).

The reference is the calm "workspace" look of modern docs and task tools: a warm grey sidebar, big confident page titles, soft pastel status pills, and board columns made of plain white cards.

### Principles

1. **Content first, chrome last.** Tasks, properties and dates are the interface. Borders, shadows and backgrounds stay barely visible.
2. **Colour = meaning.** Grey is the default. Red, amber, blue, green and purple appear only as status. Never use colour for decoration.
3. **One accent.** A single blue is used for the primary action and the selected state. Nothing else competes with it.
4. **Big titles, small everything else.** Each page has one large title. Everything below it is calm and evenly sized.
5. **Whitespace does the grouping.** Prefer space over boxes, lines over cards, and cards over coloured panels.
6. **Same on phone.** The owner checks this from a phone at the property. Every screen must work at 375px wide.

---

## 2. Colour

### Light theme (default)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | Main page background |
| `--bg2` | `#F7F7F5` | Sidebar, board column background, table header |
| `--hover` | `#EFEFED` | Hover on nav items, rows, ghost buttons |
| `--card` | `#FFFFFF` | Cards, modals, menus |
| `--line` | `#E9E9E7` | Default borders and dividers |
| `--line2` | `#D9D9D6` | Input borders, stronger dividers |
| `--tx` | `#37352F` | Main text (warm near-black, never pure black) |
| `--tx2` | `#55534E` | Secondary text, nav items |
| `--tx3` | `#6F6E69` | Hints, counts, placeholders, timestamps |
| `--acc` | `#1F6FC5` | Primary button, links, selected tab, focus ring |
| `--acc2` | `#185A9F` | Primary button hover |
| `--accDim` | `#E7F3F8` | Selected nav item background |

### Status colours (the only other colours allowed)

Each status has three parts: a soft **background**, a darker **text** colour, and a small **dot**. Shown as a pill: `● Overdue 3`.

| Status | Background | Text | Dot | Used for |
|---|---|---|---|---|
| **Red** | `#FDEBEC` | `#9F2F2D` | `#E16259` | Overdue tasks, new guest requests, errors |
| **Amber** | `#FBF3DB` | `#835B00` | `#DFAB01` | Due soon (next 30 days), in progress |
| **Blue** | `#E7F3F8` | `#1F5A85` | `#529CCA` | Scheduled / upcoming, waiting on vendor |
| **Green** | `#EDF3EC` | `#2B593F` | `#4DAB9A` | Done, completed, closed |
| **Purple** | `#F6F3F9` | `#5A3F87` | `#9A6DD7` | Walkthroughs, inspections |
| **Grey** | `#F1F1EF` | `#5F5E5B` | `#9B9A97` | Not started, no data, archived |

All text/background pairs above pass WCAG AA (4.5:1) for normal text, including grey hint text (`--tx3`) and white text on the blue button.

### Dark theme (optional, follows the phone/computer setting)

| Token | Value |
|---|---|
| `--bg` | `#191919` |
| `--bg2` | `#202020` |
| `--hover` | `#2C2C2C` |
| `--card` | `#252525` |
| `--line` | `#2F2F2F` |
| `--line2` | `#3F3F3F` |
| `--tx` | `#E6E6E4` |
| `--tx2` | `#ADADAA` |
| `--tx3` | `#7D7C78` |
| `--acc` | `#529CCA` |

In dark mode, status pills keep their dot colour and use a 15% tint of the dot as background with light text.

### Rules

- No gradients, no glows, no coloured shadows.
- The coral `#FF6B4D` and the rainbow of nav-icon colours from the current version are retired.
- Logo mark is the only place a brand colour may appear outside of status.

---

## 3. Typography

One font family, the computer's own system font (fast, no download):

```
-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif
```

| Style | Size / line-height | Weight | Use |
|---|---|---|---|
| Page title | 40px / 1.2 | 700 | One per page: "Schedule", "Properties" |
| Section title | 20px / 1.3 | 600 | Groups inside a page |
| Card title | 15px / 1.4 | 500 | Task names, property names |
| Body | 15px / 1.55 | 400 | Default text |
| Small | 13px / 1.45 | 400 | Meta lines, table cells, descriptions |
| Label | 12px / 1.3 | 500 | Column headers, sidebar group labels ("Recents", "Properties") |

- Letter-spacing: `-0.02em` on page titles only. No all-caps labels with wide tracking; use sentence case ("Recents", not "RECENTS").
- Numbers in tables use `font-variant-numeric: tabular-nums` so costs and dates line up.
- Model/serial numbers may use `ui-monospace` at 13px.
- On phones, page title drops to 30px.

---

## 4. Spacing, shape and depth

**Spacing scale (px):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Use only these.

| Token | Value | Use |
|---|---|---|
| `--r-sm` | `4px` | Pills, small buttons, inputs |
| `--r` | `6px` | Buttons, nav items, menu items |
| `--r-lg` | `10px` | Cards, modals |
| `--sh-card` | `0 1px 2px rgba(15,15,15,.06)` | Cards on a board (barely there) |
| `--sh-pop` | `0 4px 12px rgba(15,15,15,.08), 0 0 0 1px rgba(15,15,15,.05)` | Menus, modals, toasts |

Cards are defined by a 1px `--line` border plus `--sh-card`. Nothing floats higher than a menu.

---

## 5. Layout

```
┌──────────────┬──────────────────────────────────────────────┐
│ Sidebar 240  │  Top bar 44px (breadcrumb · actions)         │
│ (#F7F7F5)    ├──────────────────────────────────────────────┤
│              │        [page icon 56px]                      │
│ Home  ⌕      │        Page title (40px)                     │
│              │        View tabs ─────────────── [New ▾]     │
│ Recents      │        ─────────────────────────────────     │
│ Properties   │        Content (board / list / table)        │
│ Workspace    │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- **Sidebar:** 240px wide, `--bg2`, no right border shadow (1px `--line` only). Collapses to a slide-out drawer under 900px.
- **Content:** left padding 96px on desktop (gives the big title room to breathe), 16px on phone. Text-heavy pages cap at 900px wide; boards and tables may go full width and scroll sideways.
- **Top bar:** 44px, shows where you are ("Sea Winds C-11 / Schedule") and quiet icon actions on the right.
- **Page header:** optional large icon (56px, single colour `--tx2`), then the page title, then the view tabs row with the primary **New** button on the right.

### Sidebar structure

| Group | Items |
|---|---|
| Top | Home (Dashboard), Search, Requests (with count) |
| **Properties** | One row per property (switches the active property) · "+ Add property" |
| **Workspace** | Schedule, Walkthroughs, Appliances, Vendors |
| Bottom | Settings, account |

- Nav item: 30px tall, 6px radius, `--tx2` text, 18px grey line icon. Hover = `--hover`. Selected = `--hover` background + `--tx` text + weight 500 (no coloured highlight).
- Counts sit right-aligned in `--tx3`. Only an **overdue** count gets the red pill.

---

## 6. Components

### Buttons

| Type | Look | Use |
|---|---|---|
| **Primary** | `--acc` fill, white text, 32px tall, 6px radius | One per screen: "New task", "Log completion", "Create account" |
| **Split primary** | Primary + a ▾ section divided by a 1px white/20% line | "New ▾" → Task, Walkthrough, Vendor, Appliance |
| **Secondary** | White, 1px `--line2` border, `--tx` text | "Cancel", "Export" |
| **Ghost** | No border, `--tx2` text, `--hover` on hover | Toolbar actions, "← Back" |
| **Icon** | 28×28 ghost, 16px icon | Sort, filter, search, expand, settings in a toolbar row |
| **Danger** | Ghost with red text; turns red-filled only in the confirm dialog | Delete |

### View tabs

A row of text tabs with small icons, like `▦ Board   ☰ List   ▤ Table   + `.
Selected tab: `--hover` pill background, `--tx` text. Others: `--tx3`. A 1px `--line` runs under the whole row. The toolbar icons (sort, filter, search) sit on the same row, right side, before **New**.

### Status pill

`● Overdue  3` — 22px tall, 4px radius, status background, status text, 8px dot, 12–13px weight 500. The count (when shown) is plain `--tx3` next to it, outside the pill.

### Board (Kanban) column

- Column: 272px wide, a very light tint of its status colour as background (e.g. Overdue `#FDF6F5`, Due `#FDFAF1`, Upcoming `#F5F9FC`, Done `#F6FAF6`), 8px padding, 10px radius. Header is the status pill + count.
- Card: white, 1px `--line`, `--sh-card`, 10px radius, 12px 14px padding. Title 15/500. Optional second line in 13px `--tx3` (property · due date · vendor).
- Optional small avatar/icon on the right edge of a card (vendor initials or a trade icon) in a 28px circle.
- Last item in each column: ghost "+ New" row in `--tx3`.
- Hover card: background `#FAFAF9`. Drag: `--sh-pop`, 2° tilt not allowed (keep it calm).

### List & table rows

- Row height 40px, divider 1px `--line`, hover `--hover`. No zebra stripes.
- Header row: 12px label style, `--tx3`, `--bg2` background.
- Columns of money and dates right-aligned, tabular numbers.

### Inputs

32–36px tall, 1px `--line2`, 4px radius, white background. Focus: border `--acc` + `0 0 0 3px rgba(31,111,197,.15)`. Labels above, 13px `--tx2`. Help text below in 12px `--tx3`. Errors: red text below, red border; never a red background.

### Cards (dashboard summary)

Plain white with `--line` border, 10px radius, 20px padding. A big number (28px/600) with a small label under it. Status colour appears only in a pill or the dot beside the number, never as the card fill.

### Menus, modals, toasts

- **Menu:** white, `--sh-pop`, 6px radius, items 30px tall.
- **Modal:** 480–640px wide, centered, white, `--sh-pop`, page behind dims to `rgba(15,15,15,.4)`. Title 20/600, primary action bottom-right.
- **Toast:** bottom-center, dark (`#2F2F2F`) with white text, 6px radius, disappears after 4s. One at a time.

### Notification bubble (optional)

Matches the reference: a small white card floating top-right, avatar or icon on the left, two lines of text, and a red count badge (`#E16259`, white 11px number). Use for "3 tasks became overdue" or a new guest request. Dismissible.

### Empty states

A short sentence and one button, centered, in `--tx2`. Optional small line illustration in grey (original artwork only, simple house / wrench / clipboard shapes). Example: "No tasks due this month. Nice work." + "View schedule".

---

## 7. Mapping PropertyPulse screens to the patterns

| Screen | Page icon | Default view | Views offered | Board columns / statuses |
|---|---|---|---|---|
| **Dashboard** (Home) | House | Summary cards + "Needs attention" list | — | Overdue, Due soon, Open requests, Walkthroughs due |
| **Schedule** | Calendar | Board | Board · List · (Calendar later) | ● Overdue (red) · ● Due this month (amber) · ● Upcoming (blue) · ● Done (green) |
| **Requests** | Inbox | Board | Board · List | ● New (red) · ● In progress (amber) · ● Waiting on vendor (blue) · ● Closed (green) |
| **Walkthroughs** | Clipboard | List | List · Board | ● Scheduled (purple) · ● In progress (amber) · ● Complete (green) |
| **Properties** | Building | Cards (one per property) | Cards · Table | — |
| **Appliances** | Plug | Table | Table · List | Grey "Missing info" pill when model/install year is blank |
| **Vendors** | People | Table | Table · List | — |
| **Settings** | Gear | Simple form page, 640px wide | — | — |
| **Home, signed out** | Logo | Top bar (Guest access · Sign in · Create an account), centered headline, product preview, 3 features, How it works, guest stay-code box, footer. Content max 1040px | — | Real status pills inside the product preview |
| **Sign in / create account** | Logo | Single centered column, 440px | — | — |
| **Guest portal & vendor link** | Logo | Single column, no sidebar, phone-first | — | Same pills as Requests / Walkthroughs |

Status wording is the same everywhere. A task is never "late" on one screen and "overdue" on another.

---

## 8. Icons & imagery

- One icon style: **outline, 1.5px stroke, rounded ends**, 16px in toolbars, 18px in the sidebar, 56px for page icons. All grey (`--tx2`) unless showing status.
- Free, consistent set recommended: Lucide (lucide.dev) or Tabler Icons.
- Illustrations, if any: simple black line drawings with one flat fill colour from the status palette, used only in empty states and the landing page. Original artwork only; do not copy another product's mascots or illustration style.
- Property photos (walkthroughs) are shown in 4:3 thumbnails, 6px radius, no border.

---

## 9. Motion

Quiet and fast. Hover and selection changes: 120ms ease. Menus and modals: 150ms fade + 4px rise. No bouncing, no spinning logos, no confetti. Respect "reduce motion" on the device.

---

## 10. Phone (under 640px)

- Sidebar becomes a drawer opened from a ☰ button in the top bar.
- Page title 30px, content padding 16px.
- Board view becomes **one column at a time** with the status pills as swipeable tabs; List is the default on phones.
- Primary action becomes a full-width button at the bottom of forms, or a round 52px "+" button bottom-right on list pages.
- Tap targets at least 44px tall.

---

## 11. Accessibility

- Text contrast AA minimum (all tokens above are checked).
- Status is never shown by colour alone: always a word ("Overdue") plus the dot.
- Visible focus ring on every interactive element (blue, 3px soft halo).
- All icon-only buttons have a label for screen readers.

---

## 12. Do / Don't

| Do | Don't |
|---|---|
| White page, grey sidebar, one blue button | Dark backgrounds with neon accents |
| Status pills with a dot and a word | Coloured card backgrounds or coloured nav icons |
| One big page title | Several bold headings competing at the top |
| Space and thin lines to group things | Heavy shadows, gradients, thick borders |
| Sentence case everywhere | ALL-CAPS labels with wide letter-spacing |
| Same status words on every screen | Mixing "late", "past due", "overdue" |

---

## 13. Ready-to-paste tokens

Replace the current `:root{…}` block at the top of `index.html` with this. Existing variable names are kept where possible so most screens update automatically; the coloured ones (`--violet`, `--teal`, `--pink`, `--blue`, `--amber`) are mapped onto the calm status palette.

```css
:root{
  /* surfaces */
  --bg:#FFFFFF; --bg2:#F7F7F5; --hover:#EFEFED;
  --card:#FFFFFF; --card2:#F7F7F5;
  --line:#E9E9E7; --line2:#D9D9D6;
  /* text */
  --tx:#37352F; --tx2:#55534E; --tx3:#6F6E69;
  /* accent */
  --acc:#1F6FC5; --acc2:#185A9F; --accDim:#E7F3F8;
  /* status: dot / soft background / text */
  --bad:#E16259;  --badDim:#FDEBEC;  --badTx:#9F2F2D;
  --warn:#DFAB01; --warnDim:#FBF3DB; --warnTx:#835B00;
  --info:#529CCA; --infoDim:#E7F3F8; --infoTx:#1F5A85;
  --ok:#4DAB9A;   --okDim:#EDF3EC;   --okTx:#2B593F;
  --walk:#9A6DD7; --walkDim:#F6F3F9; --walkTx:#5A3F87;
  --mute:#9B9A97; --muteDim:#F1F1EF; --muteTx:#5F5E5B;
  /* legacy names, mapped to the calm palette */
  --amber:var(--warn); --amberDim:var(--warnDim);
  --blue:var(--info);  --blueDim:var(--infoDim);
  --violet:var(--walk);--violetDim:var(--walkDim);
  --teal:var(--ok);    --tealDim:var(--okDim);
  --pink:var(--bad);   --pinkDim:var(--badDim);
  /* shape & depth */
  --r-sm:4px; --r:6px; --r-lg:10px; --r2:10px;
  --sh:0 1px 2px rgba(15,15,15,.06);
  --sh-pop:0 4px 12px rgba(15,15,15,.08),0 0 0 1px rgba(15,15,15,.05);
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#191919; --bg2:#202020; --hover:#2C2C2C;
    --card:#252525; --card2:#2C2C2C;
    --line:#2F2F2F; --line2:#3F3F3F;
    --tx:#E6E6E4; --tx2:#ADADAA; --tx3:#7D7C78;
    --acc:#529CCA; --acc2:#6AAFDB; --accDim:rgba(82,156,202,.18);
    --badDim:rgba(225,98,89,.18);  --badTx:#F4A29C;
    --warnDim:rgba(223,171,1,.18); --warnTx:#F0CF6A;
    --infoDim:rgba(82,156,202,.18);--infoTx:#9CC8E6;
    --okDim:rgba(77,171,154,.18);  --okTx:#8FD3C5;
    --walkDim:rgba(154,109,215,.18);--walkTx:#C9AEF0;
    --muteDim:rgba(155,154,151,.16);--muteTx:#C4C3BF;
  }
}
```

---

## 14. What it takes to apply this (checklist)

1. **Swap the colour tokens** (section 13). Biggest visual change, about 10 minutes, low risk.
2. **Sidebar:** remove coloured icon squares and the gradient logo glow; selected item becomes grey instead of coral; group properties under a "Properties" label.
3. **Page headers:** add the big page title + optional icon + view-tabs row with the **New ▾** button on the right.
4. **Status pills:** one shared pill style for every status listed in section 7; replace any coloured badges.
5. **Board view** for Schedule and Requests (List stays available).
6. **Buttons & inputs:** restyle to the specs in section 6.
7. **Phone pass:** check every screen at 375px wide (drawer sidebar, one-column board, 44px tap targets).
8. **Check:** contrast, focus rings, and that status words match everywhere.

Steps 1–4 deliver about 80% of the new look in one working session.
