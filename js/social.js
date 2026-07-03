/**
 * Person D — Squad & Social Features
 * File boundary: ONLY edit this file.
 *
 * Expected HTML IDs (Person A):
 *   #squad-board, #squad-member-input, #squad-add-member
 *   #panic-button, #panic-form, #panic-author, #panic-message, #panic-list
 *   #resource-drop, #resource-form, #resource-title, #resource-url,
 *   #resource-subject, #resource-list
 *
 * Expected task API (Person C):
 *   window.Tasks.getAll()  → [{ id, title, done, dueDate, effort, urgency, owner? }]
 *   window.Tasks.assignOwner(taskId, ownerName)
 *   window.Tasks.update(taskId, { owner })
 *
 * Entry point (Person E calls from app.js):
 *   initSocial()
 */

const SOCIAL_STORAGE_KEY = 'survive-uni-social';

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

function loadSocialData() {
  try {
    const raw = localStorage.getItem(SOCIAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Read tasks via Person C API, with local fallback for solo testing. */
function getTasks() {
  if (window.Tasks?.getAll) return window.Tasks.getAll();
  try {
    const raw = localStorage.getItem('survive-uni-tasks');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/** Assign owner via Person C API, with local fallback. */
function setTaskOwner(taskId, owner) {
  const name = owner || null;
  if (window.Tasks?.assignOwner) {
    window.Tasks.assignOwner(taskId, name);
    return;
  }
  if (window.Tasks?.update) {
    window.Tasks.update(taskId, { owner: name });
    return;
  }
  const tasks = getTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.owner = name;
    localStorage.setItem('survive-uni-tasks', JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent('tasks-updated'));
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

// ─── Who's Doing What board ───────────────────────────────────────────────

function renderSquadBoard() {
  const board = document.getElementById('squad-board');
  if (!board) return;

  const data = loadSocialData();
  const tasks = getTasks().filter((t) => !t.done);
  const members = data.members;

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

  const memberCards = members
    .map((member) => {
      const owned = byOwner[member] || [];
      const workload =
        owned.length === 0
          ? 'free'
          : owned.length <= 2
            ? 'light'
            : owned.length <= 4
              ? 'busy'
              : 'overloaded';

      const taskItems = owned
        .map(
          (t) => `
        <li class="squad-task" data-urgency="${t.urgency || 'chill'}">
          <span class="squad-task-title">${escapeHtml(t.title)}</span>
          <span class="squad-task-meta">${urgencyLabel(t.urgency)} ${effortLabel(t.effort)}</span>
          <button type="button" class="squad-unassign" data-task-id="${t.id}" title="Unassign">✕</button>
        </li>`
        )
        .join('');

      return `
      <article class="squad-member-card workload-${workload}" data-member="${escapeHtml(member)}">
        <header class="squad-member-header">
          <h4>${escapeHtml(member)}</h4>
          <span class="squad-count">${owned.length} task${owned.length === 1 ? '' : 's'}</span>
        </header>
        <ul class="squad-task-list">${taskItems || '<li class="squad-empty">Nothing assigned</li>'}</ul>
      </article>`;
    })
    .join('');

  const unassignedItems = unassigned
    .map(
      (t) => `
    <li class="squad-task unassigned" data-urgency="${t.urgency || 'chill'}">
      <span class="squad-task-title">${escapeHtml(t.title)}</span>
      <span class="squad-task-meta">${urgencyLabel(t.urgency)} ${effortLabel(t.effort)}</span>
      <select class="squad-assign-select" data-task-id="${t.id}" aria-label="Assign owner">
        <option value="">Assign to…</option>
        ${members.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}
      </select>
    </li>`
    )
    .join('');

  board.innerHTML = `
    <div class="squad-toolbar">
      <label for="squad-member-input">Add squad member</label>
      <div class="squad-add-row">
        <input type="text" id="squad-member-input" placeholder="Name" maxlength="30" />
        <button type="button" id="squad-add-member">Add</button>
      </div>
    </div>
    <div class="squad-members-grid">${memberCards}</div>
    <section class="squad-unassigned">
      <h4>Unassigned (${unassigned.length})</h4>
      <ul class="squad-task-list">${unassignedItems || '<li class="squad-empty">All tasks claimed!</li>'}</ul>
    </section>`;

  board.querySelectorAll('.squad-assign-select').forEach((select) => {
    select.addEventListener('change', (e) => {
      const owner = e.target.value;
      if (!owner) return;
      setTaskOwner(e.target.dataset.taskId, owner);
      renderSquadBoard();
    });
  });

  board.querySelectorAll('.squad-unassign').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      setTaskOwner(e.target.dataset.taskId, null);
      renderSquadBoard();
    });
  });

  const addBtn = board.querySelector('#squad-add-member');
  const input = board.querySelector('#squad-member-input');
  if (addBtn && input) {
    const addMember = () => {
      const name = input.value.trim();
      if (!name) return;
      const social = loadSocialData();
      if (!social.members.includes(name)) {
        social.members.push(name);
        saveSocialData(social);
      }
      input.value = '';
      renderSquadBoard();
    };
    addBtn.addEventListener('click', addMember);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addMember();
    });
  }
}

// ─── Panic Button ─────────────────────────────────────────────────────────

function renderPanicList() {
  const list = document.getElementById('panic-list');
  if (!list) return;

  const { panic } = loadSocialData();
  const active = panic.filter((p) => !p.resolved);

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
        <span>${escapeHtml(p.author)} · ${formatTime(p.timestamp)}</span>
        <button type="button" class="panic-resolve" data-id="${p.id}">Got it</button>
      </footer>
    </article>`
    )
    .join('');

  list.querySelectorAll('.panic-resolve').forEach((btn) => {
    btn.addEventListener('click', () => {
      const social = loadSocialData();
      const item = social.panic.find((p) => p.id === btn.dataset.id);
      if (item) item.resolved = true;
      saveSocialData(social);
      renderPanicList();
    });
  });
}

function postPanic(message, author) {
  const text = message.trim();
  const who = author.trim() || 'Anonymous';
  if (!text) return;

  const social = loadSocialData();
  social.panic.push({
    id: crypto.randomUUID?.() || `panic-${Date.now()}`,
    message: text,
    author: who,
    timestamp: Date.now(),
    resolved: false,
  });
  saveSocialData(social);
  renderPanicList();
}

function initPanicButton() {
  const button = document.getElementById('panic-button');
  const form = document.getElementById('panic-form');
  const messageInput = document.getElementById('panic-message');
  const authorInput = document.getElementById('panic-author');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      postPanic(messageInput?.value || '', authorInput?.value || '');
      if (messageInput) messageInput.value = '';
    });
  }

  if (button && !form) {
    button.addEventListener('click', () => {
      const message = window.prompt('SOS — what do you need help with?');
      if (message) postPanic(message, 'You');
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
    list.innerHTML = '<p class="resource-empty">No links yet — drop something useful!</p>';
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
        .reverse()
        .map(
          (r) => `
        <li class="resource-item" data-id="${r.id}">
          <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a>
          <span class="resource-meta">${escapeHtml(r.addedBy)} · ${formatTime(r.timestamp)}</span>
          <button type="button" class="resource-remove" data-id="${r.id}" title="Remove">✕</button>
        </li>`
        )
        .join('');
      return `
      <section class="resource-group">
        <h4 class="resource-subject-tag">${escapeHtml(subject)}</h4>
        <ul>${items}</ul>
      </section>`;
    })
    .join('');

  list.querySelectorAll('.resource-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const social = loadSocialData();
      social.resources = social.resources.filter((r) => r.id !== btn.dataset.id);
      saveSocialData(social);
      renderResourceList();
    });
  });
}

function addResource(title, url, subject, addedBy) {
  const cleanTitle = title.trim();
  const cleanUrl = url.trim();
  const cleanSubject = subject.trim() || 'General';
  const who = addedBy.trim() || 'Anonymous';
  if (!cleanTitle || !cleanUrl) return;

  let href = cleanUrl;
  if (!/^https?:\/\//i.test(href)) href = `https://${href}`;

  const social = loadSocialData();
  social.resources.push({
    id: crypto.randomUUID?.() || `res-${Date.now()}`,
    title: cleanTitle,
    url: href,
    subject: cleanSubject,
    addedBy: who,
    timestamp: Date.now(),
  });
  saveSocialData(social);
  renderResourceList();
}

function initResourceDrop() {
  const form = document.getElementById('resource-form');
  const titleInput = document.getElementById('resource-title');
  const urlInput = document.getElementById('resource-url');
  const subjectSelect = document.getElementById('resource-subject');
  const dropZone = document.getElementById('resource-drop');

  if (subjectSelect && subjectSelect.options.length <= 1) {
    subjectSelect.innerHTML = SUBJECTS.map(
      (s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
    ).join('');
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      addResource(
        titleInput?.value || '',
        urlInput?.value || '',
        subjectSelect?.value || 'General',
        'You'
      );
      if (titleInput) titleInput.value = '';
      if (urlInput) urlInput.value = '';
    });
  }

  if (dropZone) {
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
        urlInput.focus();
      }
    });
  }

  renderResourceList();
}

// ─── Public entry point ─────────────────────────────────────────────────────

function initSocial() {
  renderSquadBoard();
  initPanicButton();
  initResourceDrop();

  window.addEventListener('tasks-updated', renderSquadBoard);
  window.addEventListener('storage', (e) => {
    if (e.key === SOCIAL_STORAGE_KEY) {
      renderPanicList();
      renderResourceList();
    }
    if (e.key === 'survive-uni-tasks') renderSquadBoard();
  });
}

window.initSocial = initSocial;
