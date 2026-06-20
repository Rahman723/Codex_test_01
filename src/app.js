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
let finalTranscript = '';
let isRecording = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  supportMessage.textContent = 'Voice recording is available. Click Start recording and allow microphone access.';

  recognition.addEventListener('result', (event) => {
    let interimTranscript = '';

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript.trim();

      if (event.results[index].isFinal) {
        finalTranscript = appendTranscript(finalTranscript, transcript);
      } else {
        interimTranscript = appendTranscript(interimTranscript, transcript);
      }
    }

    notesInput.value = appendTranscript(finalTranscript, interimTranscript);
  });

  recognition.addEventListener('error', (event) => {
    isRecording = false;
    stopMicrophoneStream();
    resetRecordButton();
    supportMessage.textContent = getRecordingErrorMessage(event.error || event);
  });

  recognition.addEventListener('end', () => {
    isRecording = false;
    stopMicrophoneStream();
    resetRecordButton();
    finalTranscript = notesInput.value.trim();
    supportMessage.textContent = 'Recording stopped. Review the transcript or build your list.';
  });
} else {
  supportMessage.textContent = 'Speech recognition is not supported in this browser. Type or paste notes to build your list.';
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
  finalTranscript = notesInput.value.trim();

  try {
    await requestMicrophoneAccess();
    recognition.start();
    isRecording = true;
    recordButton.textContent = 'Stop recording';
    recordButton.classList.add('recording');
    supportMessage.textContent = 'Listening… speak your tasks, then click Stop recording.';
  } catch (error) {
    isRecording = false;
    stopMicrophoneStream();
    resetRecordButton();
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

function resetRecordButton() {
  recordButton.textContent = 'Start recording';
  recordButton.classList.remove('recording');
}

function appendTranscript(current, next) {
  return [current, next].map((part) => part.trim()).filter(Boolean).join(' ');
}

function getRecordingErrorMessage(error) {
  const errorName = typeof error === 'string' ? error : error.name;
  const errorMessage = typeof error === 'string' ? error : error.message;

  if (errorName === 'not-allowed' || errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    return 'Microphone access was blocked. Allow microphone permissions in your browser, then try again.';
  }

  if (errorName === 'no-speech') {
    return 'No speech was detected. Try again and speak clearly after the browser starts listening.';
  }

  if (errorName === 'audio-capture') {
    return 'No microphone was found. Connect or enable a microphone, then try again.';
  }

  if (errorMessage === 'missing-media-devices') {
    return 'This browser cannot request microphone access. Try a current Chrome or Edge browser.';
  }

  if (errorName === 'InvalidStateError') {
    return 'Recording is already starting. Please wait a moment and try again.';
  }

  return 'Could not start recording. Check your microphone permissions and try again.';
}

clearButton.addEventListener('click', () => {
  notesInput.value = '';
  finalTranscript = '';
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
