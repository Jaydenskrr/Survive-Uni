/**
 * Person E — App bootstrap & integration
 * Wires campus hub UI to Person C (tasks), Person D (social), Person E (features).
 */
(function () {
  'use strict';

  const tasksApi = () => window.SurviveUni && window.SurviveUni.tasks;
  const featuresApi = () => window.SurviveUni && window.SurviveUni.features;

  function initNav() {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('main-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
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

  function initScrollReveals() {
    if ('IntersectionObserver' in window) {
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
    } else {
      document.querySelectorAll('.event-card').forEach(function (card) {
        card.classList.add('is-visible');
      });
    }
  }

  function isSurvivalMode() {
    const checkbox = document.getElementById('survival-mode-checkbox');
    return Boolean(checkbox && checkbox.checked);
  }

  function applySurvivalMode() {
    const on = isSurvivalMode();
    document.body.classList.toggle('survival-mode', on);

    const api = tasksApi();
    document.querySelectorAll('.todo-item[data-task-id]').forEach(function (item) {
      if (!api) return;
      const task = api.findById(item.dataset.taskId);
      if (!task) return;
      item.hidden = on && api.getUrgencyBucket(task) !== 'urgent';
    });

    document.querySelectorAll('.squad-task[data-urgency="chill"], .squad-task[data-urgency="soon"]').forEach(function (el) {
      el.hidden = on;
    });
  }

  function initSurvivalMode() {
    const checkbox = document.getElementById('survival-mode-checkbox');
    if (!checkbox) return;
    checkbox.addEventListener('change', applySurvivalMode);
    applySurvivalMode();
  }

  function wrapTaskCompletion() {
    const api = tasksApi();
    if (!api || api._personEWrapped) return;

    const original = api.markDone.bind(api);
    api.markDone = function (taskId) {
      const result = original(taskId);
      if (result && featuresApi()?.onTaskCompleted) {
        featuresApi().onTaskCompleted();
      }
      return result;
    };
    api._personEWrapped = true;
  }

  function updateDashboardSummary() {
    const summary = document.getElementById('today-summary-text');
    const api = tasksApi();
    if (!summary || !api) return;

    const active = api.list();
    const streak = featuresApi() ? featuresApi().getStreak() : 0;

    if (active.length === 0) {
      summary.textContent =
        streak > 0
          ? `You're all clear today — ${streak}-day streak still alive. Add tasks on Calendar or coordinate in Squad Tools.`
          : "You're all clear — add tasks on Calendar or coordinate with your squad.";
      return;
    }

    const groups = api.getByUrgency();
    const urgent = groups.urgent.length;
    const parts = [`You have ${active.length} active task${active.length === 1 ? '' : 's'}`];
    if (urgent > 0) parts.push(`${urgent} urgent`);
    if (streak > 0) parts.push(`${streak}-day streak`);
    parts.push('— Calendar for to-dos, Squad Tools to assign work.');
    summary.textContent = parts.join(', ').replace(', —', ' —');
  }

  function initDashboardIntegration() {
    if (!document.getElementById('today-summary-text')) return;
    document.addEventListener('tasks:changed', function () {
      updateDashboardSummary();
      applySurvivalMode();
    });
    updateDashboardSummary();
  }

  function initSocial() {
    if (!document.getElementById('squad-board')) return;
    if (window.SurviveUni?.social?.init) {
      window.SurviveUni.social.init();
    } else if (typeof window.initSocial === 'function') {
      window.initSocial();
    }
  }

  function scrollToHash() {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(function () {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }

  function initApp() {
    initNav();
    initTodayLabel();
    initScrollReveals();
    wrapTaskCompletion();
    initSurvivalMode();

    if (typeof window.initFeatures === 'function') {
      window.initFeatures();
    }

    initDashboardIntegration();
    initSocial();
    scrollToHash();

    document.addEventListener('tasks:changed', applySurvivalMode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
