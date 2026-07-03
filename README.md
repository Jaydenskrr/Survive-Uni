# Survive-Uni

A browser-based app to help students survive uni — track assignments, deadlines, and get along with friends.

## Task Engine API

The Task Engine is the foundation module. Load scripts in this order:

```html
<script src="js/storage.js"></script>
<script src="js/tasks.js"></script>
```

All APIs are exposed on the global `SurviveUni` namespace.

### Task object shape

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | yes | Unique identifier |
| `title` | `string` | yes | Trimmed, non-empty |
| `dueDate` | `string \| null` | no | ISO date `YYYY-MM-DD`; null = no deadline |
| `effort` | `'quick' \| 'boss'` | yes | Quick Win vs Big Boss Fight |
| `done` | `boolean` | yes | Default `false` |
| `snoozedUntil` | `string \| null` | yes | ISO date; null = not snoozed |
| `createdAt` | `string` | yes | ISO datetime |

### Effort tags

| Value | Label | Emoji |
|-------|-------|-------|
| `quick` | Quick Win | ⚡ |
| `boss` | Big Boss Fight | 🐉 |

Constants: `SurviveUni.tasks.EFFORT.QUICK` / `SurviveUni.tasks.EFFORT.BOSS`

Helpers: `getEffortLabel(effort)`, `getEffortEmoji(effort)`

### Urgency buckets

Tasks are auto-sorted by due date into three groups via `getByUrgency()`:

| Bucket | Condition |
|--------|-----------|
| **urgent** | Due within 2 days (includes overdue) |
| **soon** | Due in 3–7 days |
| **chill** | Due in 8+ days, or no due date |

Thresholds: `SurviveUni.tasks.URGENCY.URGENT_DAYS` (2), `SurviveUni.tasks.URGENCY.SOON_DAYS` (7)

Labels: `SurviveUni.tasks.URGENCY_LABELS`

### Methods

| Method | Description |
|--------|-------------|
| `add({ title, dueDate?, effort? })` | Create a task. Returns the new task. Throws if title is empty. |
| `list({ includeDone?, includeSnoozed? })` | List tasks. Default: active only (not done, not snoozed). |
| `markDone(id)` | Mark task done. Returns updated task or `null`. |
| `snooze(id, untilDate)` | Snooze until ISO date (today or future). Returns updated task or `null`. |
| `snoozeForDays(id, days)` | Snooze for N days from today. |
| `getByUrgency()` | Returns `{ urgent: [], soon: [], chill: [] }` sorted by due date. |
| `findById(id)` | Find a task by id. |
| `daysUntil(dueDate)` | Days until due (negative = overdue). |
| `isSnoozed(task)` | Whether task is currently snoozed. |

### Storage (low-level)

| Method | Description |
|--------|-------------|
| `SurviveUni.storage.loadTasks()` | Read all tasks from localStorage. |
| `SurviveUni.storage.saveTasks(tasks)` | Persist task array. |
| `SurviveUni.storage.clearTasks()` | Clear all stored tasks (demo reset). |

### Events

After every mutating operation (`add`, `markDone`, `snooze`), a `tasks:changed` event fires on `document`:

```js
document.addEventListener('tasks:changed', (e) => {
  const allTasks = e.detail.tasks;
  render(allTasks);
});
```

### Example usage

```js
// Add tasks
SurviveUni.tasks.add({ title: 'CS101 lab', dueDate: '2026-07-05', effort: 'boss' });
SurviveUni.tasks.add({ title: 'Buy textbooks', effort: 'quick' });

// List active tasks
const active = SurviveUni.tasks.list();

// Group by urgency for UI sections
const { urgent, soon, chill } = SurviveUni.tasks.getByUrgency();

// Mark done
SurviveUni.tasks.markDone(taskId);

// Snooze for 3 days
SurviveUni.tasks.snoozeForDays(taskId, 3);

// Listen for changes
document.addEventListener('tasks:changed', (e) => {
  console.log('Tasks updated:', e.detail.tasks);
});
```
