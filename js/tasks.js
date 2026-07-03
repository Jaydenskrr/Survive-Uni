(function () {
  'use strict';

  const URGENCY = {
    URGENT_DAYS: 2,
    SOON_DAYS: 7,
  };

  const EFFORT = {
    QUICK: 'quick',
    BOSS: 'boss',
  };

  const URGENCY_LABELS = {
    urgent: 'Urgent',
    soon: 'Soon',
    chill: 'Chill',
  };

  const EFFORT_LABELS = {
    quick: 'Quick Win',
    boss: 'Big Boss Fight',
  };

  const EFFORT_EMOJI = {
    quick: '\u26A1',
    boss: '\uD83D\uDC09',
  };

  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function toISODate(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function parseISODate(isoDate) {
    const parts = isoDate.split('-').map(Number);
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function daysUntil(dueDate) {
    if (!dueDate) return null;
    const due = parseISODate(dueDate);
    if (!due) return null;
    const today = startOfToday();
    const diffMs = due.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  function normalizeDueDate(value) {
    if (value == null || value === '') return null;
    return toISODate(value);
  }

  function normalizeEffort(effort) {
    if (effort === EFFORT.BOSS) return EFFORT.BOSS;
    return EFFORT.QUICK;
  }

  function isSnoozed(task) {
    if (!task.snoozedUntil) return false;
    const until = parseISODate(task.snoozedUntil);
    if (!until) return false;
    return startOfToday().getTime() < until.getTime();
  }

  function loadAll() {
    return window.SurviveUni.storage.loadTasks();
  }

  function persist(tasks) {
    const ok = window.SurviveUni.storage.saveTasks(tasks);
    if (!ok) throw new Error('Failed to save tasks');
    emitChange(tasks);
    return tasks;
  }

  function emitChange(tasks) {
    document.dispatchEvent(
      new CustomEvent('tasks:changed', { detail: { tasks } })
    );
  }

  function findById(id) {
    return loadAll().find((t) => t.id === id) || null;
  }

  function filterTasks(tasks, options) {
    const includeDone = options && options.includeDone;
    const includeSnoozed = options && options.includeSnoozed;

    return tasks.filter((task) => {
      if (!includeDone && task.done) return false;
      if (!includeSnoozed && isSnoozed(task)) return false;
      return true;
    });
  }

  function add(input) {
    const title = (input.title || '').trim();
    if (!title) throw new Error('Task title is required');

    const task = {
      id: generateId(),
      title,
      dueDate: normalizeDueDate(input.dueDate),
      effort: normalizeEffort(input.effort),
      done: false,
      snoozedUntil: null,
      createdAt: new Date().toISOString(),
    };

    const tasks = loadAll().concat(task);
    persist(tasks);
    return task;
  }

  function list(options) {
    return filterTasks(loadAll(), options || {});
  }

  function updateTask(id, updater) {
    const tasks = loadAll();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const updated = updater({ ...tasks[index] });
    tasks[index] = updated;
    persist(tasks);
    return updated;
  }

  function markDone(id) {
    return updateTask(id, (task) => ({
      ...task,
      done: true,
      snoozedUntil: null,
    }));
  }

  function snooze(id, untilDate) {
    const normalized = normalizeDueDate(untilDate);
    if (!normalized) throw new Error('Invalid snooze date');

    const today = toISODate(startOfToday());
    if (normalized < today) {
      throw new Error('Snooze date must be today or in the future');
    }

    return updateTask(id, (task) => ({
      ...task,
      snoozedUntil: normalized,
    }));
  }

  function snoozeForDays(id, days) {
    const n = Number(days);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error('Days must be a non-negative number');
    }
    const until = new Date(startOfToday());
    until.setDate(until.getDate() + n);
    return snooze(id, until);
  }

  function getUrgencyBucket(task) {
    if (!task.dueDate) return 'chill';
    const days = daysUntil(task.dueDate);
    if (days === null) return 'chill';
    if (days <= URGENCY.URGENT_DAYS) return 'urgent';
    if (days <= URGENCY.SOON_DAYS) return 'soon';
    return 'chill';
  }

  function sortByDueDate(a, b) {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  }

  function getByUrgency() {
    const active = list();
    const groups = { urgent: [], soon: [], chill: [] };

    for (const task of active) {
      groups[getUrgencyBucket(task)].push(task);
    }

    groups.urgent.sort(sortByDueDate);
    groups.soon.sort(sortByDueDate);
    groups.chill.sort(sortByDueDate);

    return groups;
  }

  function getEffortLabel(effort) {
    return EFFORT_LABELS[effort] || EFFORT_LABELS.quick;
  }

  function getEffortEmoji(effort) {
    return EFFORT_EMOJI[effort] || EFFORT_EMOJI.quick;
  }

  window.SurviveUni = window.SurviveUni || {};
  window.SurviveUni.tasks = {
    URGENCY,
    URGENCY_LABELS,
    EFFORT,
    EFFORT_LABELS,
    EFFORT_EMOJI,
    add,
    list,
    markDone,
    snooze,
    snoozeForDays,
    getByUrgency,
    findById,
    daysUntil,
    getEffortLabel,
    getEffortEmoji,
    isSnoozed,
  };
})();
