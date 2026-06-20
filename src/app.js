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
let microphoneStream;
let isRecording = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  supportMessage.textContent = 'Voice recording is available. Click Start recording and allow microphone access.';

  recognition.addEventListener('result', (event) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .map((result) => result[0].transcript)
      .join(' ');

    notesInput.value = `${notesInput.value.trim()} ${transcript}`.trim();
  });

  recognition.addEventListener('end', () => {
    isRecording = false;
    stopMicrophoneStream();
    recordButton.textContent = 'Start recording';
    recordButton.classList.remove('recording');
    supportMessage.textContent = 'Recording stopped. Review the transcript or build your list.';
  });
} else {
  supportMessage.textContent = 'Speech recognition is not supported here. You can still type or paste notes.';
  recordButton.disabled = true;
}

recordButton.addEventListener('click', async () => {
  if (!recognition) return;

  if (isRecording) {
    recognition.stop();
    stopMicrophoneStream();
    return;
  }

  await startRecording();
});

async function startRecording() {
  recordButton.disabled = true;
  supportMessage.textContent = 'Requesting microphone access…';

  try {
    await requestMicrophoneAccess();
    recognition.start();
    isRecording = true;
    recordButton.textContent = 'Stop recording';
    recordButton.classList.add('recording');
    supportMessage.textContent = 'Listening… speak your tasks, then click Stop recording.';
  } catch (error) {
    stopMicrophoneStream();
    supportMessage.textContent = getRecordingErrorMessage(error);
  } finally {
    recordButton.disabled = false;
  }
}

async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('missing-media-devices');
  }

  microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
}

function stopMicrophoneStream() {
  microphoneStream?.getTracks().forEach((track) => track.stop());
  microphoneStream = undefined;
}

function getRecordingErrorMessage(error) {
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return 'Microphone access was blocked. Allow microphone permissions in your browser, then try again.';
  }

  if (error.message === 'missing-media-devices') {
    return 'This browser cannot request microphone access. Try a current Chrome or Edge browser.';
  }

  if (error.name === 'InvalidStateError') {
    return 'Recording is already starting. Please wait a moment and try again.';
  }

  return 'Could not start recording. Check your microphone permissions and try again.';
}

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
