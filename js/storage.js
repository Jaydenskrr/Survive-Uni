(function () {
  'use strict';

  const STORAGE_KEY = 'survive-uni-tasks';

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch {
      return false;
    }
  }

  function clearTasks() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  window.SurviveUni = window.SurviveUni || {};
  window.SurviveUni.storage = {
    STORAGE_KEY,
    loadTasks,
    saveTasks,
    clearTasks,
  };
})();
