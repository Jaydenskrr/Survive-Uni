# HTML Element ID Map (Person A — Campus Hub)

**Status: HTML is frozen — campus hub structure**

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Redirects to `dashboard.html` |
| `dashboard.html` | Timetable, deadlines, events preview, announcements |
| `communities.html` | Groups / chat (WhatsApp-style) |
| `calendar.html` | School calendar + to-do list |
| `events.html` | Campus event newsfeed |

## Shared chrome (every page)

| ID | Purpose |
|----|---------|
| `#site-header` | Top header bar |
| `#site-header-inner` | Header content wrapper |
| `#site-logo` | Logo / home link |
| `#nav-toggle` | Mobile menu button |
| `#main-nav` | Main navigation links (`data-nav` on each link) |
| `#page-main` | Page content wrapper |
| `#site-footer` | Footer |

## dashboard.html

| ID | Purpose |
|----|---------|
| `#today-summary` | Today overview widget |
| `#today-date-label` | Current date label |
| `#today-summary-text` | Summary text |
| `#dashboard-grid` | Main 2-column layout |
| `#dashboard-primary` | Left column |
| `#dashboard-sidebar` | Right column |
| `#timetable-panel` | Timetable section |
| `#weekly-timetable` | Timetable table |
| `#timetable-body` | Timetable rows (JS fills) |
| `#deadlines-panel` | Deadlines section |
| `#deadlines-list` | Deadline items |
| `#deadlines-empty` | Empty state (hidden by default) |
| `#events-preview-panel` | Upcoming events preview |
| `#upcoming-events-list` | Event preview items |
| `#events-preview-link` | Link to full events page |
| `#announcements-panel` | Announcements section |
| `#announcements-list` | Announcement items |
| `#quick-links` | Shortcut links nav |

**Scripts:** `js/storage.js`, `js/dashboard.js`, `js/app.js`

## communities.html

| ID | Purpose |
|----|---------|
| `#communities-layout` | 3-pane layout |
| `#communities-sidebar` | Community list sidebar |
| `#community-search` | Search form |
| `#community-search-input` | Search input |
| `#community-search-btn` | Search button |
| `#join-community-form` | Join-by-code form |
| `#join-community-code` | Join code input |
| `#join-community-btn` | Join button |
| `#communities-list` | List of communities |
| `#chat-panel` | Chat area |
| `#chat-header` | Chat header bar |
| `#chat-header-title` | Active community name |
| `#chat-header-meta` | Member count / meta |
| `#chat-messages` | Message thread |
| `#chat-compose-form` | Send message form |
| `#chat-input` | Message input |
| `#chat-send-btn` | Send button |
| `#members-panel` | Members sidebar |
| `#member-role-filter` | Filter lecturers / students |
| `#community-members-list` | Member list |
| `#community-item-template` | Template for new community items |
| `#chat-message-template` | Template for new messages |

**Scripts:** `js/storage.js`, `js/communities.js`, `js/app.js`

## calendar.html

| ID | Purpose |
|----|---------|
| `#calendar-layout` | Calendar + sidebar layout |
| `#calendar-panel` | Calendar section |
| `#calendar-toolbar` | Prev / next / view toggle |
| `#calendar-prev` | Previous month |
| `#calendar-next` | Next month |
| `#calendar-month-label` | Current month label |
| `#calendar-view-toggle` | Month / week view |
| `#calendar-grid` | Calendar grid wrapper |
| `#calendar-weekdays` | Day name headers |
| `#calendar-days` | Day cells (`.calendar-day`, `data-date`) |
| `#calendar-legend` | Event vs assignment legend |
| `#todo-panel` | To-do section |
| `#todo-form` | Add to-do form |
| `#todo-title` | Task title input |
| `#todo-due` | Due date input |
| `#todo-add-btn` | Add button |
| `#todo-list` | To-do items |
| `#day-detail-panel` | Selected day details |
| `#selected-day-label` | Selected date label |
| `#day-events-list` | Events on selected day |
| `#day-assignments-list` | Assignments due on selected day |
| `#calendar-event-template` | Template for calendar events |
| `#todo-item-template` | Template for to-do items |

**Scripts:** `js/storage.js`, `js/calendar.js`, `js/app.js`

## events.html

| ID | Purpose |
|----|---------|
| `#events-layout` | Filter + feed layout |
| `#events-filter-bar` | Filter sidebar |
| `#events-search` | Search input |
| `#events-category-filter` | Category dropdown |
| `#events-date-filter` | Date range dropdown |
| `#events-feed` | Scrollable newsfeed |
| `#events-load-more` | Pagination button |
| `#event-card-template` | Template for event cards |

Event card classes: `.event-card`, `.event-title`, `.event-date`, `.event-location`, `.event-summary`, `.event-category`, `.event-image`

**Scripts:** `js/storage.js`, `js/events.js`, `js/app.js`

## CSS (Person A structural)

| File | Owner |
|------|-------|
| `css/layout.css` | Person A — grid, flex, responsive layout |
| `css/base.css` | Person B — visual styling |
| `css/theme.css` | Person B — theme / Survival Mode |

## Run locally

```bash
python -m http.server 8080
```

Open http://localhost:8080 (redirects to dashboard).
