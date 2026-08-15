import { ArrowRight, CheckCircle2, CircleAlert, LoaderCircle, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formApi } from '../services/api';

export default function FormAnalysis() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    formApi.get(formId).then(setForm).catch(() => setError('This form session was not found. Start a new analysis from the dashboard.'));
  }, [formId]);

  const generate = async () => {
    if (!form) return;
    setBusy(true);
    try {
      setForm(await formApi.generate(form.id, form.questions));
      navigate(`/forms/${form.id}/review`);
    } catch {
      setError('Could not generate answers. Is the API running?');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="p-10"><div className="rounded-xl border border-[#f0d3d0] bg-white p-6 text-sm text-[#a64d48]"><CircleAlert className="mb-2"/>{error}</div></div>;
  if (!form) return <div className="grid h-64 place-items-center text-sm text-[#718177]"><LoaderCircle className="animate-spin"/>Loading form...</div>;

  return <div className="mx-auto max-w-5xl px-9 py-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#438b64]">Step 1 of 2</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-1.2px]">Form analysis</h2>
        <p className="mt-2 max-w-xl text-sm text-[#718177]">We found {form.questions.length} questions. Review the form structure, then create answer drafts using your profile context.</p>
      </div>
      <span className="rounded-full bg-[#edf8f0] px-3 py-1.5 text-xs font-semibold text-[#3d875c]">Google Forms · {form.mode === 'live' ? 'Live extraction' : 'Preview mode'}</span>
    </div>
    <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_260px]">
      <section className="rounded-2xl border border-[#e0e7df] bg-white">
        <div className="border-b border-[#edf0eb] px-6 py-4"><p className="truncate text-xs text-[#718177]">{form.url}</p></div>
        <div className="divide-y divide-[#edf0eb]">{form.questions.map((question, index) => <article key={question.id} className="flex gap-4 px-6 py-5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#edf8f0] text-[11px] font-bold text-[#3e9364]">{index + 1}</span>
          <div>
            <div className="flex items-center gap-2"><h3 className="text-sm font-bold">{question.label}</h3>{question.required && <span className="text-xs text-[#ce6962]">Required</span>}</div>
            <p className="mt-1 text-xs capitalize text-[#7e8d83]">{question.type.replace('_', ' ')}</p>
            {question.options?.length > 0 && <p className="mt-2 text-xs text-[#66776d]">Options: {question.options.join(', ')}</p>}
          </div>
        </article>)}</div>
      </section>
      <aside className="h-fit rounded-2xl border border-[#dce9df] bg-[#eff8f1] p-5">
        <span className="grid size-9 place-items-center rounded-lg bg-[#d9f0e0] text-[#358c5d]"><Sparkles size={18}/></span>
        <h3 className="mt-4 text-sm font-bold">Ready to generate</h3>
        <p className="mt-2 text-xs leading-5 text-[#648071]">The agent will classify each question, retrieve relevant context, draft an answer, and validate it.</p>
        <button onClick={generate} disabled={busy} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#3d9b69] text-xs font-bold text-white disabled:bg-[#9bc2aa]">{busy ? 'Generating...' : <>Generate drafts <ArrowRight size={15}/></>}</button>
        <div className="mt-4 flex items-start gap-2 text-[10px] leading-4 text-[#5e7869]"><CheckCircle2 size={14} className="mt-.5 shrink-0"/>You can edit every answer before authorizing the extension.</div>
      </aside>
    </div>
  </div>;
}
