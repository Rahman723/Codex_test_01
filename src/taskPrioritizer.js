const URGENT_WORDS = ['urgent', 'asap', 'today', 'deadline', 'due', 'by ', 'before', 'must'];
const IMPACT_WORDS = ['client', 'boss', 'manager', 'proposal', 'presentation', 'invoice', 'report', 'meeting', 'standup'];
const QUICK_WIN_WORDS = ['call', 'email', 'text', 'send', 'buy', 'book', 'schedule'];
const TASK_STARTERS = /(?:^|\b)(?:i need to|need to|have to|must|should|remember to|don't forget to|todo:?|task:?|please)\s+/i;

export function extractTasks(notes) {
  if (!notes || !notes.trim()) {
    return [];
  }

  const normalized = notes
    .replace(/\s+/g, ' ')
    .split(/(?:\.|!|\?|;|\n|,\s+(?=(?:and\s+)?(?:i\s+)?(?:need|have|must|should|call|email|send|buy|prepare|finish|submit|schedule|book|review))|\s+and\s+(?=(?:then\s+)?(?:i\s+)?(?:need|have|must|should|call|email|send|buy|prepare|finish|submit|schedule|book|review)))/i)
    .map(cleanTaskText)
    .filter(Boolean);

  return dedupe(normalized).map((title) => {
    const score = scoreTask(title);
    return {
      title,
      priority: labelPriority(score),
      score,
      reason: describeReason(title, score),
    };
  }).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

function cleanTaskText(text) {
  const cleaned = text
    .replace(TASK_STARTERS, '')
    .replace(/^(?:and|then|also|i)\s+/i, '')
    .trim();

  if (cleaned.length < 3) {
    return '';
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function scoreTask(task) {
  const lower = task.toLowerCase();
  let score = 50;

  score += countMatches(lower, URGENT_WORDS) * 20;
  score += countMatches(lower, IMPACT_WORDS) * 12;
  score += countMatches(lower, QUICK_WIN_WORDS) * 6;

  if (/\b\d{1,2}\s?(?:am|pm)\b|\bnoon\b|\btonight\b/i.test(task)) {
    score += 18;
  }

  if (task.length > 90) {
    score -= 5;
  }

  return Math.min(100, Math.max(10, score));
}

function countMatches(text, words) {
  return words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
}

function labelPriority(score) {
  if (score >= 82) return 'High';
  if (score >= 62) return 'Medium';
  return 'Low';
}

function describeReason(task, score) {
  const lower = task.toLowerCase();
  if (URGENT_WORDS.some((word) => lower.includes(word)) || score >= 82) {
    return 'Time-sensitive or high-impact language detected.';
  }
  if (IMPACT_WORDS.some((word) => lower.includes(word))) {
    return 'Potential work impact detected.';
  }
  if (QUICK_WIN_WORDS.some((word) => lower.includes(word))) {
    return 'Quick action that can clear mental clutter.';
  }
  return 'Useful task with no urgent signals.';
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
