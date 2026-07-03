(function () {
  'use strict';

  const STORAGE_KEY = 'survive-uni-tasks';

  const DEFAULT_TASKS = [
    {
      id: 'seed-cs101-a2',
      title: 'Finish CS101 Assignment 2',
      dueDate: '2026-07-04',
      effort: 'boss',
      done: false,
      snoozedUntil: null,
      owner: null,
      createdAt: '2026-07-03T00:00:00.000Z',
    },
    {
      id: 'seed-math201-notes',
      title: 'Review Math201 notes',
      dueDate: '2026-07-07',
      effort: 'quick',
      done: false,
      snoozedUntil: null,
      owner: null,
      createdAt: '2026-07-03T00:00:00.000Z',
    },
    {
      id: 'seed-math201-ps5',
      title: 'Math201 Problem Set 5',
      dueDate: '2026-07-07',
      effort: 'quick',
      done: false,
      snoozedUntil: null,
      owner: null,
      createdAt: '2026-07-03T00:00:00.000Z',
    },
  ];

  function normalizeTask(task) {
    if (!task || typeof task !== 'object') return null;
    const title = String(task.title || '').trim();
    if (!title) return null;

    return {
      id: task.id || null,
      title,
      dueDate: task.dueDate || null,
      effort: task.effort === 'boss' ? 'boss' : 'quick',
      done: Boolean(task.done),
      snoozedUntil: task.snoozedUntil || null,
      owner: task.owner ? String(task.owner).trim() : null,
      createdAt: task.createdAt || new Date().toISOString(),
    };
  }

  function normalizeTasks(tasks) {
    if (!Array.isArray(tasks)) return [];
    return tasks.map(normalizeTask).filter(Boolean);
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return normalizeTasks(parsed);
    } catch {
      return [];
    }
  }

  function seedIfEmpty() {
    if (loadTasks().length === 0) {
      saveTasks(DEFAULT_TASKS);
      return true;
    }
    return false;
  }

  function saveTasks(tasks) {
    try {
      const normalized = normalizeTasks(tasks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      notifyTasksChanged(normalized);
      return true;
    } catch {
      return false;
    }
  }

  function notifyTasksChanged(tasks) {
    if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
      document.dispatchEvent(
        new CustomEvent('tasks:changed', { detail: { tasks } })
      );
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('tasks-updated'));
    }
  }

  function clearTasks() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      notifyTasksChanged([]);
      return true;
    } catch {
      return false;
    }
  }

  function resetTasks() {
    return saveTasks(DEFAULT_TASKS);
  }

  window.SurviveUni = window.SurviveUni || {};
  window.SurviveUni.storage = {
    STORAGE_KEY,
    loadTasks,
    saveTasks,
    clearTasks,
    resetTasks,
    seedIfEmpty,
    normalizeTask,
  };
})();
