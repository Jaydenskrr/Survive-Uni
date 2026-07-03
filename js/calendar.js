(function () {
  'use strict';

  const tasksApi = () => window.SurviveUni && window.SurviveUni.tasks;

  function formatDueDate(dueDate) {
    if (!dueDate) return '';
    return new Date(dueDate + 'T00:00:00').toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    });
  }

  function renderTodoList() {
    const listEl = document.getElementById('todo-list');
    const template = document.getElementById('todo-item-template');
    const api = tasksApi();
    if (!listEl || !api) return;

    const tasks = api.list().sort(function (a, b) {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    listEl.innerHTML = '';

    if (tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'todo-empty';
      empty.textContent = 'No tasks yet — add one above.';
      listEl.appendChild(empty);
      return;
    }

    tasks.forEach(function (task) {
      let item;
      if (template) {
        item = template.content.firstElementChild.cloneNode(true);
      } else {
        item = document.createElement('li');
        item.className = 'todo-item';
        item.innerHTML =
          '<span class="todo-title"></span>' +
          '<time class="todo-due"></time>' +
          '<button type="button" class="todo-done-btn">Done</button>';
      }

      item.dataset.todoId = task.id;
      item.dataset.taskId = task.id;

      const titleEl = item.querySelector('.todo-title');
      const dueEl = item.querySelector('.todo-due');
      const btn = item.querySelector('.todo-done-btn');

      if (titleEl) titleEl.textContent = task.title;
      if (dueEl) {
        dueEl.dateTime = task.dueDate || '';
        dueEl.textContent = task.dueDate ? 'Due ' + formatDueDate(task.dueDate) : 'No due date';
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Done';
      }

      listEl.appendChild(item);
    });

    renderDayAssignments(getSelectedDate());
    markCalendarAssignments();
  }

  function getSelectedDate() {
    const label = document.getElementById('selected-day-label');
    if (!label) return toISODate(new Date());
    const parsed = Date.parse(label.textContent);
    if (!isNaN(parsed)) return toISODate(new Date(parsed));
    return toISODate(new Date());
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function renderDayAssignments(isoDate) {
    const listEl = document.getElementById('day-assignments-list');
    const api = tasksApi();
    if (!listEl || !api || !isoDate) return;

    const tasks = api.list().filter(function (t) {
      return t.dueDate === isoDate;
    });

    listEl.innerHTML = '';

    if (tasks.length === 0) {
      listEl.innerHTML = '<li>No assignments due.</li>';
      return;
    }

    tasks.forEach(function (task) {
      const li = document.createElement('li');
      li.textContent = task.title;
      listEl.appendChild(li);
    });
  }

  function markCalendarAssignments() {
    const api = tasksApi();
    const days = document.querySelectorAll('.calendar-day[data-date]');
    if (!api || !days.length) return;

    const dueDates = new Set(
      api.list().filter(function (t) { return t.dueDate; }).map(function (t) { return t.dueDate; })
    );

    days.forEach(function (day) {
      const date = day.dataset.date;
      let marker = day.querySelector('.calendar-marker--assignment');
      if (dueDates.has(date)) {
        if (!marker) {
          marker = document.createElement('span');
          marker.className = 'calendar-marker calendar-marker--assignment';
          marker.setAttribute('aria-hidden', 'true');
          day.appendChild(marker);
        }
      } else if (marker) {
        marker.remove();
      }
    });
  }

  function handleTodoForm(event) {
    event.preventDefault();
    const api = tasksApi();
    const titleInput = document.getElementById('todo-title');
    const dueInput = document.getElementById('todo-due');
    if (!api || !titleInput) return;

    const title = titleInput.value.trim();
    if (!title) return;

    api.add({
      title: title,
      dueDate: dueInput && dueInput.value ? dueInput.value : null,
      effort: 'quick',
    });

    titleInput.value = '';
    if (dueInput) dueInput.value = '';
    renderTodoList();
  }

  function handleTodoListClick(event) {
    const btn = event.target.closest('.todo-done-btn');
    if (!btn) return;

    const item = btn.closest('.todo-item');
    const api = tasksApi();
    if (!item || !api || item.classList.contains('is-done')) return;

    const id = item.dataset.taskId || item.dataset.todoId;
    if (!id) return;

    api.markDone(id);
    renderTodoList();
  }

  function initCalendar() {
    if (window.SurviveUni && window.SurviveUni.storage) {
      window.SurviveUni.storage.seedIfEmpty();
    }
    const form = document.getElementById('todo-form');
    const listEl = document.getElementById('todo-list');

    if (form) form.addEventListener('submit', handleTodoForm);
    if (listEl) listEl.addEventListener('click', handleTodoListClick);

    renderTodoList();
    document.addEventListener('tasks:changed', renderTodoList);
    window.addEventListener('tasks-updated', renderTodoList);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
  } else {
    initCalendar();
  }
})();
