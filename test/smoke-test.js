'use strict';

const fs = require('fs');
const path = require('path');

const store = {};
const listeners = {};

global.window = global;
global.document = {
  addEventListener(type, fn) {
    (listeners[type] = listeners[type] || []).push(fn);
  },
  dispatchEvent(event) {
    (listeners[event.type] || []).forEach((fn) => fn(event));
  },
};
global.localStorage = {
  getItem(key) {
    return store[key] ?? null;
  },
  setItem(key, value) {
    store[key] = value;
  },
  removeItem(key) {
    delete store[key];
  },
};
global.CustomEvent = class CustomEvent {
  constructor(type, opts) {
    this.type = type;
    this.detail = opts && opts.detail;
  }
};

const root = path.join(__dirname, '..');
eval(fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8'));
eval(fs.readFileSync(path.join(root, 'js/tasks.js'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error('FAIL: ' + message);
  console.log('PASS:', message);
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function inDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

SurviveUni.storage.clearTasks();

let changed = 0;
document.addEventListener('tasks:changed', () => changed++);

const task = SurviveUni.tasks.add({
  title: 'Essay',
  dueDate: tomorrow(),
  effort: 'boss',
});
assert(task.id, 'add returns task with id');
assert(task.effort === 'boss', 'effort is boss');
assert(SurviveUni.tasks.list().length === 1, 'list shows 1 task');
assert(changed === 1, 'tasks:changed fires on add');

const urgent = SurviveUni.tasks.getByUrgency().urgent;
assert(urgent.some((t) => t.id === task.id), 'tomorrow task is urgent');

const soonTask = SurviveUni.tasks.add({
  title: 'Reading',
  dueDate: inDays(5),
  effort: 'quick',
});
assert(
  SurviveUni.tasks.getByUrgency().soon.some((t) => t.id === soonTask.id),
  '5-day task is soon'
);

const chillTask = SurviveUni.tasks.add({
  title: 'Optional project',
  dueDate: inDays(14),
});
assert(
  SurviveUni.tasks.getByUrgency().chill.some((t) => t.id === chillTask.id),
  '14-day task is chill'
);

SurviveUni.tasks.snoozeForDays(task.id, 3);
assert(SurviveUni.tasks.list().length === 2, 'snoozed task hidden from list');
assert(
  SurviveUni.tasks.list({ includeSnoozed: true }).length === 3,
  'includeSnoozed shows snoozed task'
);

SurviveUni.tasks.markDone(soonTask.id);
assert(SurviveUni.tasks.list().length === 1, 'done task hidden from list');

assert(SurviveUni.storage.loadTasks().length === 3, 'persistence: 3 tasks in storage');
assert(changed >= 4, 'tasks:changed fires on mutations');

assert(SurviveUni.tasks.getEffortLabel('quick') === 'Quick Win', 'effort label quick');
assert(SurviveUni.tasks.getEffortEmoji('boss') === '\uD83D\uDC09', 'effort emoji boss');
assert(SurviveUni.tasks.getUrgencyBucket({ dueDate: tomorrow() }) === 'urgent', 'getUrgencyBucket urgent');

SurviveUni.tasks.assignOwner(task.id, 'Alex');
const assigned = SurviveUni.tasks.findById(task.id);
assert(assigned && assigned.owner === 'Alex', 'assignOwner persists owner');

console.log('\nAll smoke tests passed!');
