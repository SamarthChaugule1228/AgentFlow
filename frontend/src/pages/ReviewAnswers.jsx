import { Check, ChevronLeft, CircleAlert, ExternalLink, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formApi } from '../services/api';

const confidenceClass = score => score >= 0.8 ? 'bg-[#e7f6ec] text-[#2e8657]' : score >= 0.5 ? 'bg-[#fff5dc] text-[#9b751d]' : 'bg-[#fff0ee] text-[#b35d55]';

function extensionMessage(extensionId, payload) {
  return new Promise((resolve, reject) => {
    window.chrome.runtime.sendMessage(extensionId, payload, response => {
      const error = window.chrome.runtime.lastError?.message;
      if (error) reject(new Error(error));
      else resolve(response || { ok: false, message: 'No response from the extension.' });
    });
  });
}

export default function ReviewAnswers() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => { formApi.get(formId).then(setForm).catch(() => setNotice('This review session was not found.')); }, [formId]);
  const ready = useMemo(() => form?.questions.every(question => question.answer.trim() && question.validation === 'Ready'), [form]);
  const setAnswer = (id, answer) => setForm(current => ({ ...current, questions: current.questions.map(question => question.id === id ? { ...question, answer, validation: 'pending' } : question) }));

  const validate = async () => {
    if (!form) return;
    setBusy(true);
    try {
      setForm(await formApi.validate(form.id, form.questions));
      setNotice('Answers validated.');
    } catch {
      setNotice('Could not validate answers.');
    } finally {
      setBusy(false);
    }
  };

  const sendToExtension = async (type) => {
    const extensionId = import.meta.env.VITE_EXTENSION_ID;
    if (!extensionId || !window.chrome?.runtime) throw new Error('Add VITE_EXTENSION_ID after loading the extension, then restart the web app.');
    return extensionMessage(extensionId, { type, formUrl: form.url, answers: form.questions.map(({ label, answer, type: questionType }) => ({ label, answer, type: questionType })) });
  };

  const fillExtension = async () => {
    if (!form || !ready) return;
    setBusy(true);
    try {
      const response = await sendToExtension('AGENTFLOW_FILL');
      if (!response.ok) throw new Error(response.message);
      setForm(await formApi.recordExecution(form.id, 'filled'));
      setNotice(response.message);
    } catch (error) {
      setNotice(error.message || 'Could not fill the Google Form.');
    } finally {
      setBusy(false);
    }
  };

  const submitForm = async () => {
    if (!form || !window.confirm('Submit the filled Google Form now? This action cannot be undone.')) return;
    setBusy(true);
    try {
      const response = await sendToExtension('AGENTFLOW_SUBMIT');
      if (!response.ok) throw new Error(response.message);
      setForm(await formApi.recordExecution(form.id, 'submitted'));
      setNotice('Form submitted successfully and recorded in history.');
    } catch (error) {
      if (form) setForm(await formApi.recordExecution(form.id, 'submission_failed'));
      setNotice(error.message || 'The form could not be submitted.');
    } finally {
      setBusy(false);
    }
  };

  if (!form) return <div className="grid h-64 place-items-center gap-2 text-sm text-[#718177]"><LoaderCircle className="animate-spin"/>Loading review...</div>;
  const filled = form.status === 'filled';
  const submitted = form.status === 'submitted';

  return <div className="mx-auto max-w-5xl px-9 py-10">
    <Link to={`/forms/${form.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#4a8564]"><ChevronLeft size={15}/> Back to analysis</Link>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#438b64]">Step 2 of 2</p><h2 className="mt-2 text-3xl font-bold tracking-[-1.2px]">Review AI answers</h2><p className="mt-2 text-sm text-[#718177]">Edit anything that needs your voice, validate it, then approve filling.</p></div><a href={form.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#4d8062]">Open original form <ExternalLink size={14}/></a></div>
    <section className="mt-7 rounded-2xl border border-[#e0e7df] bg-white"><div className="flex items-center justify-between border-b border-[#edf0eb] px-6 py-4"><span className="text-xs text-[#718177]">{form.questions.length} answers · Generated from profile and documents</span><span className="inline-flex items-center gap-1 text-xs font-semibold text-[#438b64]"><Sparkles size={13}/> Grounded draft</span></div>
      <div className="divide-y divide-[#edf0eb]">{form.questions.map((question, index) => <article key={question.id} className="p-6"><div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><span className="mr-2 font-mono text-[10px] text-[#72a787]">{String(index + 1).padStart(2, '0')}</span><span className="text-sm font-bold">{question.label}</span>{question.required && <span className="ml-2 text-xs text-[#ce6962]">Required</span>}<p className="mt-1 pl-6 text-[11px] text-[#7b8b81]">{question.source || 'No source yet'}</p></div><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${confidenceClass(question.confidence)}`}>{Math.round(question.confidence * 100)}% confidence</span></div>{question.type === 'long_text' ? <textarea value={question.answer} onChange={event => setAnswer(question.id, event.target.value)} rows="4" className="w-full rounded-lg border border-[#dce5dc] px-3 py-2.5 text-sm leading-6 outline-none ring-[#75b992] focus:ring-2"/> : <input value={question.answer} onChange={event => setAnswer(question.id, event.target.value)} className="h-10 w-full rounded-lg border border-[#dce5dc] px-3 text-sm outline-none ring-[#75b992] focus:ring-2"/>}<div className="mt-2 text-[11px]">{question.validation === 'Ready' ? <span className="inline-flex items-center gap-1 text-[#3a8b5c]"><Check size={13}/> Ready</span> : <span className="text-[#a47621]">{question.validation === 'pending' ? 'Revalidate after editing' : question.validation}</span>}</div></article>)}</div>
      <div className="flex flex-col gap-3 border-t border-[#edf0eb] bg-[#fbfcfa] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2 text-xs leading-5 text-[#668071]"><ShieldCheck size={18} className="shrink-0 text-[#438e61]"/>Validation checks completeness and basic format. You remain responsible for final accuracy.</div><button onClick={validate} disabled={busy || submitted} className="h-10 rounded-lg border border-[#b9d8c3] px-4 text-xs font-bold text-[#387d56] disabled:opacity-60">{busy ? 'Checking...' : 'Validate answers'}</button></div>
    </section>
    <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#d5e8da] bg-[#eff8f1] p-5 sm:flex-row sm:items-center"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#d7efdf] text-[#368d5e]"><ShieldCheck size={20}/></span><div className="flex-1"><h3 className="text-sm font-bold">Explicit approval required</h3><p className="mt-1 text-xs leading-5 text-[#658071]">Approve filling first. Submission is a separate, confirmed action after you review the filled Google Form.</p></div>{!filled && !submitted && <button onClick={fillExtension} disabled={!ready || busy} className="h-10 rounded-lg bg-[#3d9b69] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9bc2aa]">Approve & fill in Chrome</button>}{filled && <button onClick={submitForm} disabled={busy} className="h-10 rounded-lg bg-[#2c8056] px-4 text-xs font-bold text-white disabled:opacity-60">Submit approved form</button>}{submitted && <span className="text-xs font-bold text-[#2c8056]">Submitted</span>}</section>
    {notice && <p className="mt-4 flex items-center gap-2 text-xs text-[#56816a]"><CircleAlert size={15}/>{notice}</p>}
  </div>;
}
