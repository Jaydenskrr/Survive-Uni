(function () {
  'use strict';

  const tasksApi = () => window.SurviveUni && window.SurviveUni.tasks;

  function formatDueLabel(dueDate) {
    if (!dueDate) return 'No due date';
    const api = tasksApi();
    if (!api) return dueDate;

    const days = api.daysUntil(dueDate);
    const formatted = new Date(dueDate + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    if (days === null) return formatted;
    if (days < 0) return formatted + ' (overdue)';
    if (days === 0) return formatted + ' (today)';
    return formatted;
  }

  function urgencyClass(task) {
    const api = tasksApi();
    if (!api) return '';
    return 'deadline-' + api.getUrgencyBucket(task);
  }

  function renderDeadlines() {
    const listEl = document.getElementById('deadlines-list');
    const emptyEl = document.getElementById('deadlines-empty');
    const api = tasksApi();
    if (!listEl || !api) return;

    const tasks = api.list().filter((t) => t.dueDate).sort((a, b) => {
      return a.dueDate.localeCompare(b.dueDate);
    });

    listEl.innerHTML = '';

    if (tasks.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    tasks.forEach(function (task) {
      const li = document.createElement('li');
      li.className = urgencyClass(task);
      li.dataset.taskId = task.id;

      const link = document.createElement('a');
      link.href = 'calendar.html';
      const strong = document.createElement('strong');
      strong.textContent = task.title;
      link.appendChild(strong);

      const span = document.createElement('span');
      span.textContent = ' — ' + formatDueLabel(task.dueDate);

      li.appendChild(link);
      li.appendChild(span);
      listEl.appendChild(li);
    });
  }

  function initDashboard() {
    if (window.SurviveUni && window.SurviveUni.storage) {
      window.SurviveUni.storage.seedIfEmpty();
    }
    renderDeadlines();
    document.addEventListener('tasks:changed', renderDeadlines);
    window.addEventListener('tasks-updated', renderDeadlines);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }
})();
