import { extractTasks } from './taskPrioritizer.js';

const clearButton = document.querySelector('#clear-button');
const prioritizeButton = document.querySelector('#prioritize-button');
const notesInput = document.querySelector('#notes-input');
const taskList = document.querySelector('#task-list');
const taskCount = document.querySelector('#task-count');
const emptyState = document.querySelector('#empty-state');
const supportMessage = document.querySelector('#support-message');
const exampleButtons = document.querySelectorAll('.example-button');

exampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    notesInput.value = button.dataset.example;
    notesInput.focus();
    buildPrioritizedList();
  });
});

clearButton.addEventListener('click', () => {
  notesInput.value = '';
  supportMessage.textContent = 'Prompt cleared. Add a new brain dump when you are ready.';
  renderTasks([]);
  notesInput.focus();
});

prioritizeButton.addEventListener('click', buildPrioritizedList);

notesInput.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    buildPrioritizedList();
  }
});

function buildPrioritizedList() {
  const tasks = extractTasks(notesInput.value);
  renderTasks(tasks);

  supportMessage.textContent = tasks.length > 0
    ? `Built a prioritized list with ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}.`
    : 'Add a little more detail to your prompt so the planner can find tasks.';
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  taskCount.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
  emptyState.hidden = tasks.length > 0;

  tasks.forEach((task, index) => {
    const item = document.createElement('li');
    item.className = `task-card ${task.priority.toLowerCase()}`;
    item.innerHTML = `
      <div class="rank">${index + 1}</div>
      <div class="task-content">
        <div class="task-title-row">
          <h3>${escapeHtml(task.title)}</h3>
          <span class="priority-pill">${task.priority}</span>
        </div>
        <p>${task.reason}</p>
      </div>
    `;
    taskList.appendChild(item);
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[char]);
}
