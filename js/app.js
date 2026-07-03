/**
 * Person E — App bootstrap & integration
 * Wires Person C (tasks), Person D (social), and Person E (features) to Person A's HTML.
 */
(function () {
  'use strict';

  const tasksApi = () => window.SurviveUni && window.SurviveUni.tasks;
  const storageApi = () => window.SurviveUni && window.SurviveUni.storage;
  const featuresApi = () => window.SurviveUni && window.SurviveUni.features;

  function mapEffort(value) {
    if (value === 'big-boss' || value === 'boss') return 'boss';
    return 'quick';
  }

  function urgencyForTask(taskId) {
    const api = tasksApi();
    if (!api) return 'chill';
    const groups = api.getByUrgency();
    for (const bucket of ['urgent', 'soon', 'chill']) {
      if (groups[bucket].some((t) => t.id === taskId)) return bucket;
    }
    const task = api.findById(taskId);
    if (!task || !task.dueDate) return 'chill';
    return 'chill';
  }

  function formatDueDate(isoDate) {
    if (!isoDate) return 'No deadline';
    const days = tasksApi().daysUntil(isoDate);
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

    if (titleEl) titleEl.textContent = task.title;
    if (dueEl) dueEl.textContent = formatDueDate(task.dueDate);
    if (effortEl) {
      effortEl.textContent =
        tasksApi().getEffortEmoji(task.effort) +
        ' ' +
        tasksApi().getEffortLabel(task.effort);
    }

    const doneBtn = node.querySelector('.task-done-btn');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => handleTaskDone(task.id));
    }

    const snoozeBtn = node.querySelector('.task-snooze-btn');
    if (snoozeBtn) {
      snoozeBtn.addEventListener('click', () => handleTaskSnooze(task.id));
    }

    return node;
  }

  function renderBucket(listId, taskList) {
    const ul = document.getElementById(listId);
    if (!ul) return;
    ul.replaceChildren();
    for (const task of taskList) {
      ul.appendChild(createTaskElement(task));
    }
  }

  function renderTasks() {
    const api = tasksApi();
    if (!api) return;

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
    const updated = api.markDone(taskId);
    if (!updated) return;

    if (featuresApi()?.onTaskCompleted) {
      featuresApi().onTaskCompleted();
    }

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

  function initTaskForm() {
    const form = document.getElementById('task-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const api = tasksApi();
      if (!api) return;

      const titleInput = document.getElementById('task-title');
      const dueInput = document.getElementById('task-due');
      const effortInput = document.getElementById('task-effort');

      const title = titleInput?.value.trim();
      if (!title) return;

      api.add({
        title,
        dueDate: dueInput?.value || null,
        effort: mapEffort(effortInput?.value),
      });

      form.reset();
      window.dispatchEvent(new CustomEvent('tasks-updated'));
    });
  }

  function initSurvivalMode() {
    const checkbox = document.getElementById('survival-mode-checkbox');
    if (!checkbox) return;
    checkbox.addEventListener('change', renderTasks);
    applySurvivalMode();
  }

  function updateSquadTaskSelect() {
    const select = document.getElementById('squad-task-select');
    if (!select) return;

    const api = tasksApi();
    if (!api) return;

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

    if (current && active.some((t) => t.id === current)) {
      select.value = current;
    }
  }

  function initSquadAssignForm() {
    const form = document.getElementById('squad-assign-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const member = document.getElementById('squad-member-select')?.value;
      const taskId = document.getElementById('squad-task-select')?.value;
      if (!member || !taskId) return;

      if (window.Tasks?.assignOwner) {
        window.Tasks.assignOwner(taskId, member);
      }
      form.reset();
      updateSquadTaskSelect();
    });
  }

  /** Adapter so Person D's social.js can read/write tasks. */
  function installTasksAdapter() {
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
        const storage = storageApi();
        if (!storage) return;
        const tasks = storage.loadTasks();
        const index = tasks.findIndex((t) => t.id === taskId);
        if (index === -1) return;
        tasks[index] = { ...tasks[index], owner: ownerName || null };
        storage.saveTasks(tasks);
        document.dispatchEvent(
          new CustomEvent('tasks:changed', { detail: { tasks } })
        );
        window.dispatchEvent(new CustomEvent('tasks-updated'));
      },

      update(taskId, patch) {
        if (patch && Object.prototype.hasOwnProperty.call(patch, 'owner')) {
          window.Tasks.assignOwner(taskId, patch.owner);
        }
      },
    };
  }

  function initApp() {
    installTasksAdapter();
    initTaskForm();
    initSurvivalMode();
    initSquadAssignForm();
    renderTasks();

    document.addEventListener('tasks:changed', renderTasks);

    if (typeof window.initFeatures === 'function') {
      window.initFeatures();
    }
    if (typeof window.initSocial === 'function') {
      window.initSocial();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
