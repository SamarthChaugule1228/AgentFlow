const GOOGLE_FORM = /^https:\/\/(docs\.google\.com\/forms|forms\.gle)/;
const GOOGLE_LOGIN = /^https:\/\/accounts\.google\.com\//;
const READY_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 500;

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function formIdentifier(url) {
  try {
    return url.match(/\/forms\/d\/(?:e\/)?([^/?]+)/)?.[1] || new URL(url).pathname.split('/').filter(Boolean).at(-1);
  } catch {
    return '';
  }
}

function tabMatchesForm(tabUrl, formUrl) {
  const id = formIdentifier(formUrl);
  return Boolean(id && tabUrl.includes(id));
}

async function locateOrOpenForm(formUrl) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const existing = tabs.find(tab => tab.id && tabMatchesForm(tab.url || '', formUrl));
  if (existing?.id) {
    return existing.id;
  }
  const created = await chrome.tabs.create({ url: formUrl, active: false });
  return created.id;
}

async function waitForContentScript(tabId) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let lastStatus = '';

  while (Date.now() < deadline) {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab) return { ok: false, message: 'The Google Form tab was closed before it finished loading.' };
    const currentUrl = tab.url || '';
    if (GOOGLE_LOGIN.test(currentUrl)) return { ok: false, message: 'Google login required in this browser session.' };
    if (!GOOGLE_FORM.test(currentUrl)) {
      lastStatus = 'The URL redirected away from Google Forms.';
      await pause(RETRY_DELAY_MS);
      continue;
    }
    if (tab.status !== 'complete') {
      lastStatus = 'Waiting for the Google Form to finish loading.';
      await pause(RETRY_DELAY_MS);
      continue;
    }
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'AGENTFLOW_PAGE_READY' });
      if (response?.ready) return { ok: true, tab };
      lastStatus = 'Waiting for the Google Form page to become ready.';
    } catch {
      lastStatus = 'Waiting for the AgentFlow form reader to become ready.';
    }
    await pause(RETRY_DELAY_MS);
  }
  return { ok: false, message: lastStatus || 'Timed out waiting for the Google Form to load.' };
}

async function extractQuestions(tabId) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_FORM_QUESTIONS' });
      if (response?.questions?.length) return { ok: true, questions: response.questions };
    } catch {
      // The content script may still be attaching after navigation; retry below.
    }
    await pause(RETRY_DELAY_MS);
  }
  return { ok: false, message: 'The Google Form loaded, but no fillable questions were found.' };
}

async function openReadyForm(formUrl) {
  const tabId = await locateOrOpenForm(formUrl);
  if (!tabId) return { ok: false, message: 'Could not create a Google Form tab.' };
  return waitForContentScript(tabId);
}

async function requestExtraction(request) {
  const ready = await openReadyForm(request.formUrl);
  if (!ready.ok) return ready;
  return extractQuestions(ready.tab.id);
}

async function requestFill(request) {
  const ready = await openReadyForm(request.formUrl);
  if (!ready.ok) return ready;
  try {
    const response = await chrome.tabs.sendMessage(ready.tab.id, { type: 'FILL_REVIEWED_ANSWERS', answers: request.answers || [] });
    return { ok: true, message: `Filled ${response.filled} field(s). Review the form in Chrome, then explicitly submit when ready.` };
  } catch {
    return { ok: false, message: 'The form reader was not ready to fill this page. Please try again.' };
  }
}

async function requestSubmit(request) {
  const ready = await openReadyForm(request.formUrl);
  if (!ready.ok) return ready;
  try {
    const response = await chrome.tabs.sendMessage(ready.tab.id, { type: 'SUBMIT_APPROVED_FORM' });
    return response?.ok ? { ok: true, message: 'The form was submitted.' } : { ok: false, message: response?.message || 'The submit button was not found.' };
  } catch {
    return { ok: false, message: 'The extension could not submit this page. Please try again.' };
  }
}

function handleRequest(request) {
  if (request?.type === 'AGENTFLOW_EXTRACT') return requestExtraction(request);
  if (request?.type === 'AGENTFLOW_FILL') return requestFill(request);
  if (request?.type === 'AGENTFLOW_SUBMIT') return requestSubmit(request);
  return null;
}

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  const task = handleRequest(request);
  if (!task) return;
  task.then(sendResponse);
  return true;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const task = handleRequest(request);
  if (!task) return;
  task.then(sendResponse);
  return true;
});
