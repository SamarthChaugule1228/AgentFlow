function normalise(value) { return (value || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

function questionContainers() {
  const listItems = [...document.querySelectorAll('[role="listitem"]')];
  return listItems.length ? listItems : [...document.querySelectorAll('[data-item-id]')];
}

function text(node) { return (node?.textContent || '').replace(/\s+/g, ' ').trim(); }

function questionLabel(container) {
  const labelledBy = container.querySelector('input[aria-labelledby], textarea[aria-labelledby]')?.getAttribute('aria-labelledby');
  const labelledText = labelledBy?.split(/\s+/).map(id => text(document.getElementById(id))).filter(Boolean).join(' ');
  return labelledText || text(container.querySelector('[role="heading"]')) || text(container.querySelector('[data-item-title]')) || text(container).replace(/\s*\*\s*$/, '');
}

function questionType(container, label) {
  if (container.querySelector('textarea')) return 'long_text';
  if (container.querySelector('[role="checkbox"]')) return 'checkbox';
  if (container.querySelector('[role="radio"]')) return 'multiple_choice';
  const input = container.querySelector('input:not([type="hidden"])');
  if (input?.type === 'email' || /\bemail\b/i.test(label)) return 'email';
  if (input?.type === 'tel' || /\b(phone|mobile|telephone)\b/i.test(label)) return 'phone';
  return 'short_text';
}

function extractQuestions() {
  return questionContainers()
    .filter(container => container.querySelector('input:not([type="hidden"]), textarea, [role="radio"], [role="checkbox"]'))
    .map((container, index) => {
      const label = questionLabel(container);
      const type = questionType(container, label);
      const options = [...container.querySelectorAll('[role="radio"], [role="checkbox"]')]
        .map(option => option.getAttribute('aria-label') || text(option)).filter(Boolean);
      return {
        id: container.dataset.itemId || `question_${index + 1}`,
        label: label.replace(/\s*\*\s*$/, ''),
        type,
        required: /\*$/.test(label) || /required/i.test(container.getAttribute('aria-label') || ''),
        options,
      };
    })
    .filter(question => question.label);
}

function fillText(container, answer) {
  const input = container.querySelector('input:not([type="hidden"]), textarea');
  if (!input) return false;
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set;
  setter?.call(input, answer);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function fillChoice(container, answer) {
  const target = [...container.querySelectorAll('[role="radio"], [role="checkbox"]')].find(node => normalise(node.getAttribute('aria-label')) === normalise(answer) || normalise(node.textContent).includes(normalise(answer)));
  if (!target) return false;
  target.click();
  return true;
}

function fillAnswers(answers) {
  let filled = 0;
  for (const answer of answers) {
    const container = questionContainers().find(node => normalise(node.textContent).includes(normalise(answer.label)));
    if (!container || !answer.answer) continue;
    const isChoice = ['multiple_choice', 'checkbox'].includes(answer.type);
    if (isChoice ? fillChoice(container, answer.answer) : fillText(container, answer.answer)) filled += 1;
  }
  return filled;
}

function submitApprovedForm() {
  const submit = [...document.querySelectorAll('[role="button"], button')]
    .find(button => /submit/i.test(button.getAttribute('aria-label') || '') || /^submit$/i.test(text(button)));
  if (!submit) return { ok: false, message: 'The Google Forms Submit button was not found.' };
  submit.click();
  return { ok: true };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.type === 'AGENTFLOW_PAGE_READY') {
    sendResponse({ ready: document.readyState === 'complete' });
  } else if (request?.type === 'FILL_REVIEWED_ANSWERS') {
    sendResponse({ filled: fillAnswers(request.answers || []) });
  } else if (request?.type === 'EXTRACT_FORM_QUESTIONS') {
    sendResponse({ questions: extractQuestions() });
  } else if (request?.type === 'SUBMIT_APPROVED_FORM') {
    sendResponse(submitApprovedForm());
  } else return;
});
