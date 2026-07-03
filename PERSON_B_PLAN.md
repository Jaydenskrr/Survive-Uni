# Person B — Visual Design Plan

**Branch:** `person-b/visual-design` (based on `person-a/campus-hub-structure`)  
**Your files:** `css/base.css`, `css/theme.css`  
**Do not edit:** HTML files (Person A), `css/layout.css` (Person A structural grid)

---

## Your role

Person B makes the campus hub **look and feel** like a real university app. Person A built the skeleton and responsive grid; you add typography, colors, spacing polish, component styling, and optional themes/animations.

Every page already links your CSS in this order:

```html
<link rel="stylesheet" href="css/layout.css">   <!-- Person A — don't touch -->
<link rel="stylesheet" href="css/base.css">     <!-- YOU -->
<link rel="stylesheet" href="css/theme.css">    <!-- YOU -->
```

---

## Recommended build order

Work top-down so you see progress quickly on every page.

### Phase 1 — Global foundation (`base.css`)

| Task | Selectors / areas | What to style |
|------|-------------------|---------------|
| 1. CSS variables | `:root` | Brand colors, neutrals, spacing scale, border-radius, font stack |
| 2. Typography | `body`, `h1–h3`, `p`, `time` | Readable font sizes, line-height, heading hierarchy |
| 3. Site chrome | `#site-header`, `#site-logo`, `#main-nav a`, `#site-footer` | Header bar, logo, nav links, footer |
| 4. Active nav | `#main-nav a[aria-current="page"]` | Highlight current page (Person A set `aria-current`) |
| 5. Mobile nav | `#nav-toggle`, `#main-nav.is-open` | Style hamburger; Person E wires toggle in `app.js` |
| 6. Panels | `.panel` | Card-like surfaces: background, border, shadow, padding refinement |
| 7. Buttons | `button`, `[type="submit"]` | Primary / secondary / danger variants |
| 8. Forms | `input`, `select`, `textarea`, `label` | Consistent inputs, focus rings, placeholders |

### Phase 2 — Page-specific components (`base.css`)

| Page | Key selectors | Design notes |
|------|---------------|--------------|
| **Dashboard** | `#weekly-timetable`, `#deadlines-list`, `#announcements-list`, `#upcoming-events-list` | Table zebra stripes; deadline items with urgency color (red = due soon) |
| **Communities** | `.community-item`, `#chat-messages`, `.chat-message`, `.chat-message--self`, `.chat-role` | WhatsApp/Teams feel: left/right bubbles, lecturer badge distinct from student |
| **Calendar** | `.calendar-day`, `.calendar-marker--event`, `.calendar-marker--assignment`, `#todo-list`, `.todo-item` | Event = blue dot, assignment = amber/red; today cell highlighted |
| **Events** | `.event-card`, `.event-category`, `#events-filter-bar` | Newsfeed cards with category pills (Academic, Career, Social, Sports) |

### Phase 3 — Theme & modes (`theme.css`)

| Task | Description |
|------|-------------|
| Light theme (default) | Clean campus look — white/off-white panels, accent color for links/buttons |
| Dark theme (optional) | `[data-theme="dark"]` on `<html>` or `.dark-mode` on `body` |
| Exam / Survival Mode (bonus) | `.survival-mode` on `body` — dark background, hide low-priority UI (e.g. `#quick-links`, `.calendar-day:not([aria-current="date"]) .calendar-marker--event` for non-urgent) |
| Category colors | Consistent map: Career, Academic, Social, Sports |

### Phase 4 — Polish & animations (bonus)

| Animation | Target | Effect |
|-----------|--------|--------|
| Fade in | `.event-card`, `.chat-message` | `animation` on new items (Person D/E add JS later) |
| Hover states | `.community-item`, `.event-card`, `#main-nav a` | Subtle background shift |
| Done checkmark | `.todo-item.is-done` | Scale/pop when marked complete (Person C adds class) |
| Load more | `#events-load-more` | Loading state styling |

---

## File split guide

### `css/base.css` — put here

- Font imports (Google Fonts or system stack)
- `:root` design tokens (colors, spacing, shadows)
- Reset/normalize additions beyond layout.css
- All component styles (buttons, forms, panels, tables, chat, calendar, events)
- `:hover`, `:focus-visible` states
- `@media` visual tweaks (e.g. smaller text on mobile) — **not** grid changes (those stay in layout.css)

### `css/theme.css` — put here

- Light/dark color overrides via CSS variables
- `.survival-mode` overrides
- Urgency/deadline color tokens (red / yellow / green borders on deadline items)
- Category pill colors for events
- Chat role colors (lecturer vs student)

Example variable pattern:

```css
:root {
  --color-bg: #f8f9fb;
  --color-surface: #ffffff;
  --color-text: #1a1a2e;
  --color-accent: #2563eb;
  --color-urgent: #dc2626;
  --color-soon: #d97706;
  --color-chill: #16a34a;
}

body.survival-mode {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
}
```

---

## What you can do right now (checklist)

- [ ] Create `css/base.css` with variables + global typography
- [ ] Style header, nav, footer on all 4 pages
- [ ] Style `.panel` cards consistently
- [ ] Style all buttons and form inputs
- [ ] Dashboard: timetable table + deadline urgency colors
- [ ] Communities: chat bubbles (self vs others) + community list active state
- [ ] Calendar: day grid, today highlight, event/assignment markers
- [ ] Events: feed cards + category filter sidebar
- [ ] Create `css/theme.css` with light theme
- [ ] Add dark / Survival Mode theme (bonus)
- [ ] Add hover + focus + simple animations (bonus)
- [ ] Test all pages at desktop and mobile widths

---

## How to preview

```powershell
cd C:\Users\jayja\OneDrive\Documents\Projects\survive_uni
python -m http.server 8080
```

Open:

- http://localhost:8080/dashboard.html
- http://localhost:8080/communities.html
- http://localhost:8080/calendar.html
- http://localhost:8080/events.html

Missing JS files (`dashboard.js`, `app.js`, etc.) will 404 in console — that's expected until C/D/E ship. Your CSS works without JS.

---

## Git workflow

```powershell
git checkout person-b/visual-design
# edit css/base.css and css/theme.css
git add css/base.css css/theme.css
git commit -m "Add base visual styles for campus hub"
git push origin person-b/visual-design
```

Open a PR into `person-a/campus-hub-structure` (or `main` once A merges).

---

## Boundaries — don't cross into other roles

| Person | Owns | You touch? |
|--------|------|------------|
| A | HTML, `css/layout.css` | No |
| B (you) | `css/base.css`, `css/theme.css` | Yes |
| C | `js/dashboard.js`, `js/calendar.js` | No |
| D | `js/communities.js` | No |
| E | `js/events.js`, `js/app.js`, nav toggle JS | No — but style classes E adds (e.g. `.is-open`) |

---

## Design direction ideas (pick one vibe)

1. **Clean academic** — white, navy accent, serif headings (traditional uni portal)
2. **Modern SaaS** — soft grays, rounded cards, blue accent (Notion/Linear feel)
3. **Bold campus** — strong primary color from your uni brand, high contrast deadlines

Share your chosen direction in the group chat so C/D/E stay consistent.

---

## Reference: HTML element map

See [HTML_IDS.md](HTML_IDS.md) for every `id` and template Person A created.
