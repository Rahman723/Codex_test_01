import { extractTasks } from './taskPrioritizer.js';

const recordButton = document.querySelector('#record-button');
const clearButton = document.querySelector('#clear-button');
const prioritizeButton = document.querySelector('#prioritize-button');
const notesInput = document.querySelector('#notes-input');
const taskList = document.querySelector('#task-list');
const taskCount = document.querySelector('#task-count');
const emptyState = document.querySelector('#empty-state');
const supportMessage = document.querySelector('#support-message');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecording = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  supportMessage.textContent = 'Voice recording is available in this browser.';

  recognition.addEventListener('result', (event) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .map((result) => result[0].transcript)
      .join(' ');

    notesInput.value = `${notesInput.value.trim()} ${transcript}`.trim();
  });

  recognition.addEventListener('end', () => {
    isRecording = false;
    recordButton.textContent = 'Start recording';
    recordButton.classList.remove('recording');
  });
} else {
  supportMessage.textContent = 'Speech recognition is not supported here. You can still type or paste notes.';
  recordButton.disabled = true;
}

recordButton.addEventListener('click', () => {
  if (!recognition) return;

  if (isRecording) {
    recognition.stop();
    return;
  }

  recognition.start();
  isRecording = true;
  recordButton.textContent = 'Stop recording';
  recordButton.classList.add('recording');
});

clearButton.addEventListener('click', () => {
  notesInput.value = '';
  renderTasks([]);
});

prioritizeButton.addEventListener('click', () => {
  renderTasks(extractTasks(notesInput.value));
});

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
