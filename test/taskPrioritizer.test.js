import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTasks } from '../src/taskPrioritizer.js';

test('extracts and ranks urgent work above lower impact errands', () => {
  const tasks = extractTasks('I need to submit the client proposal by 2pm, buy groceries, and call Mom.');

  assert.equal(tasks.length, 3);
  assert.equal(tasks[0].title, 'Submit the client proposal by 2pm');
  assert.equal(tasks[0].priority, 'High');
});

test('returns an empty list for blank notes', () => {
  assert.deepEqual(extractTasks('   '), []);
});
