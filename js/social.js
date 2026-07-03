/**
 * Person D — Squad & Social Features
 * File boundary: ONLY edit this file.
 *
 * Expected HTML IDs (Person A):
 *   #squad-board, #squad-member-input, #squad-add-member
 *   #panic-button, #panic-form, #panic-author, #panic-message, #panic-list
 *   #resource-drop, #resource-form, #resource-title, #resource-url,
 *   #resource-subject, #resource-type, #resource-list
 *   #panic-presets (optional — auto-injected if missing)
 *
 * Expected task API (Person C):
 *   window.SurviveUni.tasks.list()
 *   window.SurviveUni.tasks.getUrgencyBucket(task)
 *   window.SurviveUni.tasks.daysUntil(dueDate)
 *   window.SurviveUni.storage.loadTasks() / saveTasks()
 *   document 'tasks:changed' event
 *
 * Entry point (Person E calls from app.js):
 *   initSocial()  — or SurviveUni.social.init()
 */

(function () {
  'use strict';

  const SOCIAL_STORAGE_KEY = 'survive-uni-social';
  const CURRENT_USER = 'You';

  const DEFAULT_MEMBERS = ['You', 'Alex', 'Sam', 'Jordan'];

  const SUBJECTS = [
    'General',
    'CS / Programming',
    'Math',
    'Science',
    'History',
    'Literature',
    'Languages',
    'Campus Life',
  ];

  const PANIC_PRESETS = [
    { emoji: '📅', label: 'Exam panic', message: "Exam tomorrow and I haven't started — send help!" },
    { emoji: '📝', label: 'Stuck on Q', message: 'Stuck on an assignment question — anyone free to explain?' },
    { emoji: '📓', label: 'Need notes', message: "Missed today's lecture — need notes ASAP" },
    { emoji: '🧠', label: 'Quiz me', message: 'Can someone quiz me before the test?' },
    { emoji: '☕', label: 'Study buddy', message: 'Need a library buddy — motivation is at zero' },
  ];

  const RESOURCE_TYPES = [
    { id: 'notes', label: '📓 Notes' },
    { id: 'video', label: '🎬 Video' },
    { id: 'past-paper', label: '📄 Past Paper' },
    { id: 'cheat-sheet', label: '📋 Cheat Sheet' },
    { id: 'other', label: '🔗 Other' },
  ];

  let panicTickTimer = null;
  let initialized = false;

  // ─── Storage & helpers ────────────────────────────────────────────────────

  function generateId(prefix) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function loadSocialData() {
    try {
      const raw = localStorage.getItem(SOCIAL_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        data.members = Array.isArray(data.members) ? data.members : [...DEFAULT_MEMBERS];
        data.panic = Array.isArray(data.panic) ? data.panic : [];
        data.resources = Array.isArray(data.resources) ? data.resources : [];
        return data;
      }
    } catch (_) {
      /* ignore corrupt data */
    }
    return { members: [...DEFAULT_MEMBERS], panic: [], resources: [] };
  }

  function saveSocialData(data) {
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(data));
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
  }

  function normalizeName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ');
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatTimeAgo(ts) {
    const secs = Math.floor((Date.now() - ts) / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return formatTime(ts);
  }

  function formatDueDate(dueDate) {
    if (!dueDate) return '';
    const daysFn = window.SurviveUni?.tasks?.daysUntil;
    if (!daysFn) return dueDate;
    const days = daysFn(dueDate);
    if (days === null) return dueDate;
    if (days < 0) return '⚠️ overdue';
    if (days === 0) return '📌 due today';
    if (days === 1) return '📌 due tomorrow';
    return `📌 ${days}d left`;
  }

  function showToast(message, type) {
    let el = document.getElementById('social-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'social-toast';
      el.className = 'social-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = `social-toast social-toast-${type || 'info'} social-toast-visible`;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => el.classList.remove('social-toast-visible'), 2800);
  }

  function isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  function guessTitleFromUrl(url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      const parts = host.split('.');
      return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + ' link' : 'Shared link';
    } catch (_) {
      return 'Shared link';
    }
  }

  // ─── Task integration (Person C) ──────────────────────────────────────────

  function getTaskUrgency(task) {
    if (window.SurviveUni?.tasks?.getUrgencyBucket) {
      return window.SurviveUni.tasks.getUrgencyBucket(task);
    }
    return task.urgency || 'chill';
  }

  function getTasks() {
    if (window.SurviveUni?.tasks?.list) return window.SurviveUni.tasks.list();
    if (window.Tasks?.getAll) return window.Tasks.getAll();
    try {
      const raw = localStorage.getItem('survive-uni-tasks');
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function notifyTasksChanged(tasks) {
    document.dispatchEvent(new CustomEvent('tasks:changed', { detail: { tasks } }));
    window.dispatchEvent(new CustomEvent('tasks-updated'));
  }

  function setTaskOwner(taskId, owner) {
    const name = owner ? normalizeName(owner) : null;
    if (window.SurviveUni?.tasks?.assignOwner) {
      window.SurviveUni.tasks.assignOwner(taskId, name);
      return;
    }
    if (window.Tasks?.assignOwner) {
      window.Tasks.assignOwner(taskId, name);
      return;
    }
    if (window.Tasks?.update) {
      window.Tasks.update(taskId, { owner: name });
      return;
    }

    const storage = window.SurviveUni?.storage;
    const tasks = storage ? storage.loadTasks() : getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.owner = name;
    if (storage) {
      storage.saveTasks(tasks);
    } else {
      localStorage.setItem('survive-uni-tasks', JSON.stringify(tasks));
      notifyTasksChanged(tasks);
    }
  }

  function urgencyLabel(urgency) {
    if (urgency === 'urgent') return '🔴 urgent';
    if (urgency === 'soon') return '🟡 soon';
    return '🟢 chill';
  }

  function effortLabel(effort) {
    if (effort === 'boss') return '🐉 Big Boss';
    if (effort === 'quick') return '⚡ Quick Win';
    return '';
  }

  function taskWeight(task) {
    const urgency = getTaskUrgency(task);
    const urgencyPts = urgency === 'urgent' ? 3 : urgency === 'soon' ? 2 : 1;
    const effortPts = task.effort === 'boss' ? 2 : task.effort === 'quick' ? 0 : 1;
    return urgencyPts + effortPts;
  }

  function sortTasksByWeight(tasks) {
    return tasks.slice().sort((a, b) => taskWeight(b) - taskWeight(a));
  }

  function workloadLevel(score) {
    if (score === 0) return 'free';
    if (score <= 4) return 'light';
    if (score <= 8) return 'busy';
    return 'overloaded';
  }

  function workloadLabel(level) {
    if (level === 'free') return '😌 Free';
    if (level === 'light') return '🙂 Light load';
    if (level === 'busy') return '😰 Busy';
    return '🔥 Overloaded';
  }

  function resourceTypeEmoji(type) {
    const found = RESOURCE_TYPES.find((t) => t.id === type);
    return found ? found.label.split(' ')[0] : '🔗';
  }

  function getPanics() {
    return loadSocialData().panic;
  }

  function savePanics(panic) {
    const data = loadSocialData();
    data.panic = panic;
    saveSocialData(data);
  }

  function ensureMembersIncludeOwners(members, tasks) {
    const set = new Set(members);
    tasks.forEach((t) => {
      if (t.owner && !set.has(t.owner)) {
        members.push(t.owner);
        set.add(t.owner);
      }
    });
    return members;
  }

  function renderTaskRow(task, members, options) {
    const due = formatDueDate(task.dueDate);
    const dueHtml = due ? `<span class="squad-task-due">${escapeHtml(due)}</span>` : '';
    const assignControls = options.unassigned
      ? `<div class="squad-assign-row">
          <button type="button" class="squad-claim" data-task-id="${task.id}">I'll take this</button>
          <select class="squad-assign-select" data-task-id="${task.id}" aria-label="Assign owner">
            <option value="">Assign to…</option>
            ${members.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}
          </select>
        </div>`
      : `<div class="squad-assign-row">
          <select class="squad-reassign-select" data-task-id="${task.id}" aria-label="Reassign owner">
            <option value="">Reassign…</option>
            ${members
              .filter((m) => m !== task.owner)
              .map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`)
              .join('')}
          </select>
          <button type="button" class="squad-unassign" data-task-id="${task.id}" title="Unassign">✕</button>
        </div>`;

    return `
      <li class="squad-task${options.unassigned ? ' unassigned' : ''}" data-urgency="${getTaskUrgency(task)}">
        <span class="squad-task-title">${escapeHtml(task.title)}</span>
        <span class="squad-task-meta">
          ${urgencyLabel(getTaskUrgency(task))} ${effortLabel(task.effort)} · ${taskWeight(task)} pts
          ${dueHtml}
        </span>
        ${assignControls}
      </li>`;
  }

  // ─── Who's Doing What board ───────────────────────────────────────────────

  function buildSquadSummary(members, byOwner, unassigned) {
    const loads = members.map((m) => ({
      name: m,
      score: (byOwner[m] || []).reduce((sum, t) => sum + taskWeight(t), 0),
      count: (byOwner[m] || []).length,
    }));
    const busiest = loads.slice().sort((a, b) => b.score - a.score)[0];
    const totalLoad = loads.reduce((sum, l) => sum + l.score, 0);

    if (unassigned.length === 0 && totalLoad === 0) {
      return '🎉 Squad is clear — nothing on the board right now';
    }
    if (unassigned.length > 0 && busiest && busiest.score >= 8) {
      return `⚡ ${unassigned.length} unassigned · ${busiest.name} is overloaded (${busiest.score} pts) — redistribute!`;
    }
    if (unassigned.length > 0) {
      return `👋 ${unassigned.length} task${unassigned.length === 1 ? '' : 's'} need a owner — claim one below`;
    }
    if (busiest && busiest.score >= 8) {
      return `🔥 ${busiest.name} is carrying the squad (${busiest.score} pts) — someone jump in`;
    }
    return `✅ Squad synced · ${totalLoad} total load pts across the group`;
  }

  function renderSquadBoard() {
    const board = document.getElementById('squad-board');
    if (!board) return;

    const data = loadSocialData();
    const tasks = getTasks().filter((t) => !t.done);
    const members = ensureMembersIncludeOwners([...data.members], tasks);

    const byOwner = {};
    members.forEach((m) => {
      byOwner[m] = [];
    });
    const unassigned = [];

    tasks.forEach((task) => {
      if (task.owner && byOwner[task.owner]) {
        byOwner[task.owner].push(task);
      } else {
        unassigned.push(task);
      }
    });

    const sortedMembers = members
      .slice()
      .sort((a, b) => {
        const scoreB = byOwner[b].reduce((s, t) => s + taskWeight(t), 0);
        const scoreA = byOwner[a].reduce((s, t) => s + taskWeight(t), 0);
        return scoreB - scoreA;
      });

    const memberCards = sortedMembers
      .map((member) => {
        const owned = sortTasksByWeight(byOwner[member] || []);
        const loadScore = owned.reduce((sum, t) => sum + taskWeight(t), 0);
        const workload = workloadLevel(loadScore);
        const taskItems = owned.map((t) => renderTaskRow(t, members, { unassigned: false })).join('');

        return `
          <article class="squad-member-card workload-${workload}" data-member="${escapeHtml(member)}" title="Load score: ${loadScore}">
            <header class="squad-member-header">
              <h4>${member === CURRENT_USER ? `${escapeHtml(member)} (you)` : escapeHtml(member)}</h4>
              <span class="squad-count">${owned.length} task${owned.length === 1 ? '' : 's'} · ${loadScore} pts</span>
              <span class="squad-workload-label">${workloadLabel(workload)}</span>
            </header>
            <ul class="squad-task-list">${taskItems || '<li class="squad-empty">Nothing assigned</li>'}</ul>
          </article>`;
      })
      .join('');

    const unassignedItems = sortTasksByWeight(unassigned)
      .map((t) => renderTaskRow(t, members, { unassigned: true }))
      .join('');

    const summary = buildSquadSummary(members, byOwner, unassigned);

    board.innerHTML = `
      <p class="squad-summary" role="status">${summary}</p>
      <div class="squad-toolbar">
        <label for="squad-member-input">Add squad member</label>
        <div class="squad-add-row">
          <input type="text" id="squad-member-input" placeholder="Flatmate / project partner" maxlength="30" />
          <button type="button" id="squad-add-member">Add</button>
        </div>
      </div>
      <div class="squad-members-grid">${memberCards}</div>
      <section class="squad-unassigned">
        <h4>Unassigned (${unassigned.length})</h4>
        <ul class="squad-task-list">${unassignedItems || '<li class="squad-empty">All tasks claimed — squad wins 🏆</li>'}</ul>
      </section>`;
  }

  function addSquadMember(name) {
    const clean = normalizeName(name);
    if (!clean) return false;

    const social = loadSocialData();
    const exists = social.members.some(
      (m) => m.toLowerCase() === clean.toLowerCase()
    );
    if (!exists) {
      social.members.push(clean);
      saveSocialData(social);
      showToast(`${clean} joined the squad`, 'success');
    } else {
      showToast(`${clean} is already in the squad`, 'info');
    }
    renderSquadBoard();
    return true;
  }

  // ─── Panic Button ─────────────────────────────────────────────────────────

  function renderPanicList() {
    const list = document.getElementById('panic-list');
    if (!list) return;

    const { panic } = loadSocialData();
    const active = panic.filter((p) => !p.resolved);

    updatePanicBadge(active.length);

    if (active.length === 0) {
      list.innerHTML = '<p class="panic-empty">No SOS right now — squad is surviving ✨</p>';
      return;
    }

    list.innerHTML = active
      .slice()
      .reverse()
      .map(
        (p) => `
        <article class="panic-item" data-id="${p.id}">
          <p class="panic-message">🆘 ${escapeHtml(p.message)}</p>
          <footer class="panic-meta">
            <span>${escapeHtml(p.author)} · ${formatTimeAgo(p.timestamp)}</span>
            <div class="panic-actions">
              <button type="button" class="panic-help" data-id="${p.id}">I'll help</button>
              <button type="button" class="panic-resolve" data-id="${p.id}">Got it</button>
            </div>
          </footer>
        </article>`
      )
      .join('');
  }

  function updatePanicBadge(count) {
    const button = document.getElementById('panic-button');
    if (!button) return;
    button.setAttribute('data-panic-count', String(count));
    button.setAttribute('aria-label', count ? `Panic button, ${count} active SOS` : 'Panic button');
  }

  function resolvePanic(panicId, helper, claimTask) {
    const social = loadSocialData();
    const item = social.panic.find((p) => p.id === panicId);
    if (!item) return;

    item.resolved = true;
    if (helper) item.helper = helper;
    saveSocialData(social);

    let claimedTitle = null;
    if (claimTask && helper) {
      const unassigned = getTasks().filter((t) => !t.done && !t.owner);
      const urgentFirst = sortTasksByWeight(unassigned)[0];
      if (urgentFirst) {
        setTaskOwner(urgentFirst.id, helper);
        claimedTitle = urgentFirst.title;
      }
    }

    if (helper && claimedTitle) {
      showToast(`${helper} is on it — claimed "${claimedTitle}"`, 'success');
    } else if (helper) {
      showToast(`${helper} is helping — SOS cleared`, 'success');
    } else {
      showToast('SOS marked as handled', 'info');
    }

    renderPanicList();
    renderSquadBoard();
  }

  function postPanic(message, author) {
    const text = normalizeName(message);
    const who = normalizeName(author) || 'Anonymous';
    if (!text) {
      showToast('Write something before sending SOS', 'error');
      return false;
    }

    const social = loadSocialData();
    const recent = social.panic.find(
      (p) =>
        !p.resolved &&
        p.message.toLowerCase() === text.toLowerCase() &&
        Date.now() - p.timestamp < 60000
    );
    if (recent) {
      showToast('Same SOS already posted — squad saw it!', 'info');
      return false;
    }

    social.panic.push({
      id: generateId('panic'),
      message: text,
      author: who,
      timestamp: Date.now(),
      resolved: false,
    });
    saveSocialData(social);
    renderPanicList();
    showToast('SOS sent to the squad 🆘', 'success');
    return true;
  }

  function renderPanicPresets(authorInput) {
    let container = document.getElementById('panic-presets');
    if (!container) {
      const anchor =
        document.getElementById('panic-form') ||
        document.getElementById('panic-list')?.parentElement;
      if (!anchor) return;

      container = document.createElement('div');
      container.id = 'panic-presets';
      container.className = 'panic-presets';
      anchor.insertBefore(container, anchor.firstChild);
    }

    container.innerHTML = `
      <p class="panic-presets-label">Quick SOS — tap one:</p>
      <div class="panic-presets-row">
        ${PANIC_PRESETS.map(
          (p, i) =>
            `<button type="button" class="panic-preset-btn" data-preset-index="${i}" title="${escapeHtml(p.message)}">${p.emoji} ${escapeHtml(p.label)}</button>`
        ).join('')}
      </div>`;

    container.querySelectorAll('.panic-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = PANIC_PRESETS[Number(btn.dataset.presetIndex)];
        if (preset) postPanic(preset.message, authorInput?.value || CURRENT_USER);
      });
    });
  }

  function initPanicButton() {
    const button = document.getElementById('panic-button');
    const form = document.getElementById('panic-form');
    const messageInput = document.getElementById('panic-message');
    const authorInput = document.getElementById('panic-author');

    renderPanicPresets(authorInput);

    if (form && !form.dataset.socialBound) {
      form.dataset.socialBound = 'true';
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (postPanic(messageInput?.value || '', authorInput?.value || CURRENT_USER)) {
          if (messageInput) messageInput.value = '';
        }
      });
    }

    if (button && !button.dataset.socialBound) {
      button.dataset.socialBound = 'true';
      button.addEventListener('click', () => {
        if (form) return;
        const message = window.prompt('SOS — what do you need help with?');
        if (message) postPanic(message, CURRENT_USER);
      });
    }

    renderPanicList();
  }

  // ─── Resource Drop Zone ───────────────────────────────────────────────────

  function renderResourceList() {
    const list = document.getElementById('resource-list');
    if (!list) return;

    const { resources } = loadSocialData();

    if (resources.length === 0) {
      list.innerHTML = '<p class="resource-empty">No links yet — drop a Drive folder, YouTube recap, or past paper!</p>';
      return;
    }

    const grouped = {};
    resources.forEach((r) => {
      const subject = r.subject || 'General';
      if (!grouped[subject]) grouped[subject] = [];
      grouped[subject].push(r);
    });

    list.innerHTML = Object.keys(grouped)
      .sort()
      .map((subject) => {
        const items = grouped[subject]
          .slice()
          .sort((a, b) => (b.savedBy?.length || 0) - (a.savedBy?.length || 0) || b.timestamp - a.timestamp)
          .map(
            (r) => `
            <li class="resource-item" data-id="${r.id}">
              <span class="resource-type-badge">${resourceTypeEmoji(r.type)}</span>
              <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a>
              <span class="resource-meta">${escapeHtml(r.addedBy)} · ${formatTimeAgo(r.timestamp)}${r.savedBy?.length ? ` · 👍 ${r.savedBy.length}` : ''}</span>
              <button type="button" class="resource-save${r.savedBy?.includes(CURRENT_USER) ? ' saved' : ''}" data-id="${r.id}" title="This saved me">👍</button>
              <button type="button" class="resource-remove" data-id="${r.id}" title="Remove">✕</button>
            </li>`
          )
          .join('');
        return `
          <section class="resource-group">
            <h4 class="resource-subject-tag">${escapeHtml(subject)} <span class="resource-group-count">(${grouped[subject].length})</span></h4>
            <ul>${items}</ul>
          </section>`;
      })
      .join('');
  }

  function addResource(title, url, subject, type, addedBy) {
    let cleanTitle = normalizeName(title);
    const cleanUrl = normalizeName(url);
    const cleanSubject = normalizeName(subject) || 'General';
    const who = normalizeName(addedBy) || 'Anonymous';
    if (!cleanUrl) {
      showToast('Paste a link first', 'error');
      return false;
    }

    let href = cleanUrl;
    if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
    if (!isValidUrl(href)) {
      showToast('That does not look like a valid URL', 'error');
      return false;
    }

    if (!cleanTitle) cleanTitle = guessTitleFromUrl(href);

    const social = loadSocialData();
    const duplicate = social.resources.some((r) => r.url === href);
    if (duplicate) {
      showToast('That link is already in the drop zone', 'info');
      return false;
    }

    social.resources.push({
      id: generateId('res'),
      title: cleanTitle,
      url: href,
      subject: cleanSubject,
      type: type || 'other',
      addedBy: who,
      savedBy: [],
      timestamp: Date.now(),
    });
    saveSocialData(social);
    renderResourceList();
    showToast(`Dropped in ${cleanSubject} 📎`, 'success');
    return true;
  }

  function initResourceDrop() {
    const form = document.getElementById('resource-form');
    const titleInput = document.getElementById('resource-title');
    const urlInput = document.getElementById('resource-url');
    const subjectSelect = document.getElementById('resource-subject');
    const typeSelect = document.getElementById('resource-type');
    const dropZone = document.getElementById('resource-drop');

    if (subjectSelect && subjectSelect.options.length <= 1) {
      subjectSelect.innerHTML = SUBJECTS.map(
        (s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
      ).join('');
    }

    if (typeSelect && typeSelect.options.length <= 1) {
      typeSelect.innerHTML = RESOURCE_TYPES.map(
        (t) => `<option value="${t.id}">${escapeHtml(t.label)}</option>`
      ).join('');
    }

    if (form && !form.dataset.socialBound) {
      form.dataset.socialBound = 'true';
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (
          addResource(
            titleInput?.value || '',
            urlInput?.value || '',
            subjectSelect?.value || 'General',
            typeSelect?.value || 'other',
            CURRENT_USER
          )
        ) {
          if (titleInput) titleInput.value = '';
          if (urlInput) urlInput.value = '';
        }
      });
    }

    if (dropZone && !dropZone.dataset.socialBound) {
      dropZone.dataset.socialBound = 'true';
      dropZone.setAttribute('tabindex', '0');
      dropZone.setAttribute('aria-label', 'Resource drop zone — paste or drop a link');

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
        if (url && urlInput) {
          urlInput.value = url.trim();
          if (!titleInput?.value) titleInput.value = guessTitleFromUrl(url.trim());
          urlInput.focus();
        }
      });
      dropZone.addEventListener('paste', (e) => {
        const text = e.clipboardData?.getData('text')?.trim();
        if (!text || !urlInput) return;
        e.preventDefault();
        urlInput.value = text;
        if (!titleInput?.value) titleInput.value = guessTitleFromUrl(text);
        urlInput.focus();
        showToast('Link pasted — add a title and hit save', 'info');
      });
    }

    renderResourceList();
  }

  // ─── Event delegation (bind once) ─────────────────────────────────────────

  function handleSquadClick(e) {
    const claim = e.target.closest('.squad-claim');
    if (claim) {
      setTaskOwner(claim.dataset.taskId, CURRENT_USER);
      showToast('You claimed a task 💪', 'success');
      renderSquadBoard();
      return;
    }

    const unassign = e.target.closest('.squad-unassign');
    if (unassign) {
      setTaskOwner(unassign.dataset.taskId, null);
      showToast('Task unassigned', 'info');
      renderSquadBoard();
      return;
    }

    const addBtn = e.target.closest('#squad-add-member');
    if (addBtn) {
      const input = document.getElementById('squad-member-input');
      if (input) addSquadMember(input.value);
      input.value = '';
    }
  }

  function handleSquadChange(e) {
    const assign = e.target.closest('.squad-assign-select, .squad-reassign-select');
    if (!assign) return;
    const owner = assign.value;
    if (!owner) return;
    setTaskOwner(assign.dataset.taskId, owner);
    showToast(`Assigned to ${owner}`, 'success');
    renderSquadBoard();
  }

  function handlePanicClick(e) {
    const help = e.target.closest('.panic-help');
    if (help) {
      resolvePanic(help.dataset.id, CURRENT_USER, true);
      return;
    }
    const resolve = e.target.closest('.panic-resolve');
    if (resolve) resolvePanic(resolve.dataset.id, null, false);
  }

  function handleResourceClick(e) {
    const save = e.target.closest('.resource-save');
    if (save) {
      const social = loadSocialData();
      const item = social.resources.find((r) => r.id === save.dataset.id);
      if (!item) return;
      if (!item.savedBy) item.savedBy = [];
      if (item.savedBy.includes(CURRENT_USER)) {
        showToast('You already saved this one', 'info');
        return;
      }
      item.savedBy.push(CURRENT_USER);
      saveSocialData(social);
      renderResourceList();
      showToast('Marked as a lifesaver 👍', 'success');
      return;
    }

    const remove = e.target.closest('.resource-remove');
    if (remove) {
      const social = loadSocialData();
      social.resources = social.resources.filter((r) => r.id !== remove.dataset.id);
      saveSocialData(social);
      renderResourceList();
      showToast('Resource removed', 'info');
    }
  }

  function setupDelegatedEvents() {
    const board = document.getElementById('squad-board');
    if (board && !board.dataset.delegated) {
      board.dataset.delegated = 'true';
      board.addEventListener('click', handleSquadClick);
      board.addEventListener('change', handleSquadChange);
      board.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.id === 'squad-member-input') {
          addSquadMember(e.target.value);
          e.target.value = '';
        }
      });
    }

    const panicList = document.getElementById('panic-list');
    if (panicList && !panicList.dataset.delegated) {
      panicList.dataset.delegated = 'true';
      panicList.addEventListener('click', handlePanicClick);
    }

    const resourceList = document.getElementById('resource-list');
    if (resourceList && !resourceList.dataset.delegated) {
      resourceList.dataset.delegated = 'true';
      resourceList.addEventListener('click', handleResourceClick);
    }
  }

  function startPanicTicker() {
    if (panicTickTimer) clearInterval(panicTickTimer);
    panicTickTimer = setInterval(renderPanicList, 60000);
  }

  // ─── Public entry point ───────────────────────────────────────────────────

  function initSocial() {
    if (initialized) {
      renderSquadBoard();
      renderPanicList();
      renderResourceList();
      return;
    }
    initialized = true;

    setupDelegatedEvents();
    renderSquadBoard();
    initPanicButton();
    initResourceDrop();
    startPanicTicker();

    window.addEventListener('tasks-updated', renderSquadBoard);
    document.addEventListener('tasks:changed', renderSquadBoard);
    window.addEventListener('storage', (e) => {
      if (e.key === SOCIAL_STORAGE_KEY) {
        renderPanicList();
        renderResourceList();
      }
      if (e.key === 'survive-uni-tasks') renderSquadBoard();
    });
  }

  window.SurviveUni = window.SurviveUni || {};
  window.SurviveUni.social = {
    init: initSocial,
    getPanics,
    savePanics,
    postPanic,
    addResource,
    assignOwner: setTaskOwner,
    renderSquadBoard,
    renderPanicList,
    renderResourceList,
  };

  window.initSocial = initSocial;
})();
