/**
 * Person E — App bootstrap & integration
 * Shared chrome: nav toggle, scroll reveals, today label (Person A/B).
 * Wires features, social, and optional legacy task panel when present.
 */
(function () {
  'use strict';

  const tasksApi = () => window.SurviveUni && window.SurviveUni.tasks;
  const storageApi = () => window.SurviveUni && window.SurviveUni.storage;
  const featuresApi = () => window.SurviveUni && window.SurviveUni.features;

  // ─── Shared chrome (main) ────────────────────────────────────────────────

  function initNavToggle() {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initTodoDemo() {
    document.querySelectorAll('.todo-done-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const item = btn.closest('.todo-item');
        if (!item || item.classList.contains('is-done')) return;
        if (item.dataset.taskId || item.dataset.todoId) return;
        item.classList.add('is-done');
        btn.textContent = 'Done';
        btn.disabled = true;
      });
    });
  }

  function initScrollReveals() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.event-card').forEach(function (card) {
        card.classList.add('is-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.1 }
    );

    document.querySelectorAll('.event-card').forEach(function (card) {
      card.classList.add('reveal-on-scroll');
      observer.observe(card);
    });
  }

  function initTodayLabel() {
    const todayLabel = document.getElementById('today-date-label');
    if (!todayLabel) return;
    todayLabel.textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  // ─── Person E integration ────────────────────────────────────────────────

  function mapEffort(value) {
    if (value === 'big-boss' || value === 'boss') return 'boss';
    return 'quick';
  }

  function urgencyForTask(taskId) {
    const api = tasksApi();
    if (!api) return 'chill';
    if (api.getUrgencyBucket && api.findById) {
      const task = api.findById(taskId);
      if (task) return api.getUrgencyBucket(task);
    }
    const groups = api.getByUrgency();
    for (const bucket of ['urgent', 'soon', 'chill']) {
      if (groups[bucket].some((t) => t.id === taskId)) return bucket;
    }
    return 'chill';
  }

  function formatDueDate(isoDate) {
    if (!isoDate) return 'No deadline';
    const api = tasksApi();
    if (!api) return isoDate;
    const days = api.daysUntil(isoDate);
    if (days === null) return isoDate;
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days}d`;
  }

  function isSurvivalMode() {
    const checkbox = document.getElementById('survival-mode-checkbox');
    return Boolean(checkbox && checkbox.checked);
  }

  function applySurvivalMode() {
    const on = isSurvivalMode();
    document.body.classList.toggle('survival-mode', on);
    document.querySelectorAll('.urgency-column.soon, .urgency-column.chill').forEach((col) => {
      col.hidden = on;
    });
  }

  function createTaskElement(task) {
    const template = document.getElementById('task-item-template');
    if (!template || !template.content) {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.dataset.taskId = task.id;
      li.textContent = task.title;
      return li;
    }

    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.taskId = task.id;
    node.dataset.urgency = urgencyForTask(task.id);

    const titleEl = node.querySelector('.task-title');
    const dueEl = node.querySelector('.task-due');
    const effortEl = node.querySelector('.task-effort');
    const api = tasksApi();

    if (titleEl) titleEl.textContent = task.title;
    if (dueEl) dueEl.textContent = formatDueDate(task.dueDate);
    if (effortEl && api) {
      effortEl.textContent = api.getEffortEmoji(task.effort) + ' ' + api.getEffortLabel(task.effort);
    }

    const doneBtn = node.querySelector('.task-done-btn');
    if (doneBtn) doneBtn.addEventListener('click', () => handleTaskDone(task.id));

    const snoozeBtn = node.querySelector('.task-snooze-btn');
    if (snoozeBtn) snoozeBtn.addEventListener('click', () => handleTaskSnooze(task.id));

    return node;
  }

  function renderBucket(listId, taskList) {
    const ul = document.getElementById(listId);
    if (!ul) return;
    ul.replaceChildren();
    for (const task of taskList) ul.appendChild(createTaskElement(task));
  }

  function renderLegacyTaskPanel() {
    const api = tasksApi();
    if (!api || !document.getElementById('task-list')) return;

    applySurvivalMode();
    const { urgent, soon, chill } = api.getByUrgency();
    renderBucket('urgent-list', urgent);
    renderBucket('soon-list', soon);
    renderBucket('chill-list', chill);
    updateSquadTaskSelect();
  }

  function handleTaskDone(taskId) {
    const api = tasksApi();
    if (!api) return;
    api.markDone(taskId);
    window.dispatchEvent(new CustomEvent('tasks-updated'));
  }

  function handleTaskSnooze(taskId) {
    const api = tasksApi();
    if (!api) return;
    const raw = window.prompt('Snooze for how many days?', '1');
    if (raw === null) return;
    const days = Number(raw);
    if (!Number.isFinite(days) || days < 0) return;
    api.snoozeForDays(taskId, days);
    window.dispatchEvent(new CustomEvent('tasks-updated'));
  }

  function initLegacyTaskForm() {
    const form = document.getElementById('task-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const api = tasksApi();
      if (!api) return;

      const title = document.getElementById('task-title')?.value.trim();
      if (!title) return;

      api.add({
        title,
        dueDate: document.getElementById('task-due')?.value || null,
        effort: mapEffort(document.getElementById('task-effort')?.value),
      });

      form.reset();
      window.dispatchEvent(new CustomEvent('tasks-updated'));
    });
  }

  function initSurvivalMode() {
    const checkbox = document.getElementById('survival-mode-checkbox');
    if (!checkbox) return;
    checkbox.addEventListener('change', renderLegacyTaskPanel);
    applySurvivalMode();
  }

  function updateSquadTaskSelect() {
    const select = document.getElementById('squad-task-select');
    const api = tasksApi();
    if (!select || !api) return;

    const active = api.list();
    const current = select.value;
    select.replaceChildren();

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pick a task';
    select.appendChild(placeholder);

    for (const task of active) {
      const opt = document.createElement('option');
      opt.value = task.id;
      opt.textContent = task.title;
      select.appendChild(opt);
    }

    if (current && active.some((t) => t.id === current)) select.value = current;
  }

  function initSquadAssignForm() {
    const form = document.getElementById('squad-assign-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const member = document.getElementById('squad-member-select')?.value;
      const taskId = document.getElementById('squad-task-select')?.value;
      if (!member || !taskId) return;

      if (tasksApi()?.assignOwner) {
        tasksApi().assignOwner(taskId, member);
      } else if (window.Tasks?.assignOwner) {
        window.Tasks.assignOwner(taskId, member);
      }

      form.reset();
      updateSquadTaskSelect();
    });
  }

  function installTasksAdapter() {
    if (window.Tasks) return;
    window.Tasks = {
      getAll() {
        const storage = storageApi();
        const api = tasksApi();
        if (!storage || !api) return [];
        return storage.loadTasks().map((task) => ({
          ...task,
          urgency: urgencyForTask(task.id),
        }));
      },
      assignOwner(taskId, ownerName) {
        const api = tasksApi();
        if (api?.assignOwner) {
          api.assignOwner(taskId, ownerName);
          return;
        }
        const storage = storageApi();
        if (!storage) return;
        const tasks = storage.loadTasks();
        const index = tasks.findIndex((t) => t.id === taskId);
        if (index === -1) return;
        tasks[index] = { ...tasks[index], owner: ownerName || null };
        storage.saveTasks(tasks);
        document.dispatchEvent(new CustomEvent('tasks:changed', { detail: { tasks } }));
        window.dispatchEvent(new CustomEvent('tasks-updated'));
      },
      update(taskId, patch) {
        if (patch && Object.prototype.hasOwnProperty.call(patch, 'owner')) {
          window.Tasks.assignOwner(taskId, patch.owner);
        }
      },
    };
  }

  function initTaskCompletionWatcher() {
    const storage = storageApi();
    const features = featuresApi();
    if (!storage || !features) return;

    let knownDoneIds = new Set(
      storage.loadTasks().filter((t) => t.done).map((t) => t.id)
    );

    document.addEventListener('tasks:changed', (e) => {
      const tasks = (e.detail && e.detail.tasks) || storage.loadTasks();
      const doneIds = new Set(tasks.filter((t) => t.done).map((t) => t.id));
      for (const id of doneIds) {
        if (!knownDoneIds.has(id)) features.onTaskCompleted();
      }
      knownDoneIds = doneIds;
    });
  }

  function initApp() {
    initNavToggle();
    initTodoDemo();
    initScrollReveals();
    initTodayLabel();

    installTasksAdapter();
    initLegacyTaskForm();
    initSurvivalMode();
    initSquadAssignForm();
    renderLegacyTaskPanel();
    initTaskCompletionWatcher();

    document.addEventListener('tasks:changed', renderLegacyTaskPanel);

    if (typeof window.initFeatures === 'function') window.initFeatures();
    if (typeof window.initSocial === 'function') window.initSocial();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
