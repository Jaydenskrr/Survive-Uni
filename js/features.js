/**
 * Person E — Motivation, Polish & Integration
 * File boundary: streak tracker + flavor text (app.js handles wiring).
 */
(function () {
  'use strict';

  const STREAK_KEY = 'survive-uni-streak';

  const FLAVOR_MESSAGES = [
    'You absolutely demolished that. The assignment never stood a chance.',
    'Another one bites the dust. Your GPA is quietly applauding.',
    'Done! Go hydrate — you earned a victory lap to the kitchen.',
    'Task complete. You are officially too powerful for this syllabus.',
    'That is what we call academic violence (the good kind).',
    'One less thing haunting your notifications. Sleep slightly easier tonight.',
    'You just speed-ran productivity. Any% world record vibes.',
    'The deadline is crying in the corner. You win.',
    'Checked off! Your future self just sent a thank-you note.',
    'Boss defeated. Loot: peace of mind and bragging rights.',
    'Productivity unlocked. Side quest complete.',
    'You did the thing! Treat yourself to something small and irresponsible.',
    'Another task falls. The semester trembles before you.',
    'Done and dusted. Time to pretend you have your life together.',
    'Victory! Your streak grows stronger, like a well-fed houseplant.',
  ];

  function toISODate(date) {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function startOfToday() {
    return toISODate(new Date());
  }

  function yesterdayISO() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toISODate(d);
  }

  function loadStreakData() {
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore corrupt data */
    }
    return { streak: 0, lastCompletionDate: null };
  }

  function saveStreakData(data) {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  }

  function getEffectiveStreak(data) {
    if (!data.lastCompletionDate || data.streak <= 0) return 0;
    const today = startOfToday();
    const yesterday = yesterdayISO();
    if (data.lastCompletionDate === today || data.lastCompletionDate === yesterday) {
      return data.streak;
    }
    return 0;
  }

  function getStreak() {
    return getEffectiveStreak(loadStreakData());
  }

  function recordCompletion() {
    const data = loadStreakData();
    const today = startOfToday();
    const yesterday = yesterdayISO();

    if (data.lastCompletionDate === today) {
      updateStreakUI(getEffectiveStreak(data));
      return getEffectiveStreak(data);
    }

    if (data.lastCompletionDate === yesterday) {
      data.streak += 1;
    } else {
      data.streak = 1;
    }

    data.lastCompletionDate = today;
    saveStreakData(data);
    updateStreakUI(data.streak);
    return data.streak;
  }

  function getRandomFlavorText() {
    return FLAVOR_MESSAGES[Math.floor(Math.random() * FLAVOR_MESSAGES.length)];
  }

  function updateStreakUI(streak) {
    const countEl = document.getElementById('streak-count');
    const unitEl = document.getElementById('streak-unit');
    const value = streak ?? getStreak();
    if (countEl) countEl.textContent = String(value);
    if (unitEl) unitEl.textContent = value === 1 ? 'day' : 'days';
  }

  function showFlavorText(message) {
    const el = document.getElementById('flavor-text');
    if (!el) return;
    el.textContent = message || getRandomFlavorText();
    el.classList.remove('flavor-pop');
    void el.offsetWidth;
    el.classList.add('flavor-pop');
  }

  function onTaskCompleted() {
    recordCompletion();
    showFlavorText(getRandomFlavorText());
  }

  function initFeatures() {
    updateStreakUI(getStreak());
  }

  window.SurviveUni = window.SurviveUni || {};
  window.SurviveUni.features = {
    getStreak,
    recordCompletion,
    getRandomFlavorText,
    showFlavorText,
    onTaskCompleted,
    updateStreakUI,
    initFeatures,
  };

  window.initFeatures = initFeatures;
})();
