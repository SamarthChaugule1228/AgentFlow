import { Check, ChevronLeft, ExternalLink, LoaderCircle, ShieldCheck, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formApi } from '../services/api';
import { Button, Badge, Card } from '../components/ui';

function extensionMessage(extensionId, payload) {
  return new Promise((resolve, reject) => {
    window.chrome.runtime.sendMessage(extensionId, payload, response => {
      const error = window.chrome.runtime.lastError?.message;
      if (error) reject(new Error(error));
      else resolve(response || { ok: false, message: 'No response from extension' });
    });
  });
}

function getValidationIcon(status) {
  if (status === 'Ready') return <CheckCircle2 size={16} className="text-[#2e8657]"/>;
  if (status?.includes('short')) return <AlertCircle size={16} className="text-[#9b751d]"/>;
  return <AlertCircle size={16} className="text-[#b35d55]"/>;
}

export default function ReviewAnswersNew() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [expandedSources, setExpandedSources] = useState({});

  useEffect(() => {
    formApi.get(formId).then(setForm).catch(() => setNotice('Review session not found'));
  }, [formId]);

  const ready = useMemo(() => form?.questions.every(q => q.answer.trim() && q.validation === 'Ready'), [form]);
  const setAnswer = (id, answer) => setForm(current => ({
    ...current,
    questions: current.questions.map(q => q.id === id ? { ...q, answer, validation: 'pending' } : q)
  }));

  const validate = async () => {
    if (!form) return;
    setBusy(true);
    try {
      setForm(await formApi.validate(form.id, form.questions));
      setNotice('✓ Answers validated');
    } catch {
      setNotice('✗ Validation failed');
    } finally {
      setBusy(false);
    }
  };

  const sendToExtension = async (type) => {
    const extensionId = import.meta.env.VITE_EXTENSION_ID;
    if (!extensionId || !window.chrome?.runtime) throw new Error('Extension not detected');
    return extensionMessage(extensionId, { type, formUrl: form.url, answers: form.questions.map(({ label, answer, type: questionType }) => ({ label, answer, type: questionType })) });
  };

  const fillExtension = async () => {
    if (!form || !ready) return;
    setBusy(true);
    try {
      const response = await sendToExtension('AGENTFLOW_FILL');
      if (!response.ok) throw new Error(response.message);
      setForm(await formApi.recordExecution(form.id, 'filled'));
      setNotice('✓ Form filled in Chrome');
    } catch (error) {
      setNotice(`✗ ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const submitForm = async () => {
    if (!form || !window.confirm('Submit this form? This cannot be undone.')) return;
    setBusy(true);
    try {
      const response = await sendToExtension('AGENTFLOW_SUBMIT');
      if (!response.ok) throw new Error(response.message);
      setForm(await formApi.recordExecution(form.id, 'submitted'));
      setNotice('✓ Form submitted successfully');
    } catch (error) {
      if (form) await formApi.recordExecution(form.id, 'submission_failed');
      setNotice(`✗ ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  if (!form) return (
    <div className="grid h-96 place-items-center">
      <div className="text-center">
        <LoaderCircle className="animate-spin mx-auto mb-4 text-[#3d9b69]"/>
        <p className="text-[#66776d]">Loading review...</p>
      </div>
    </div>
  );

  const filled = form.status === 'filled';
  const submitted = form.status === 'submitted';
  const validationStatus = form.questions.every(q => q.validation === 'Ready') ? 'ready' : 'needs_review';
  const answerCount = form.questions.filter(q => q.answer.trim()).length;

  return <div className="min-h-screen bg-[#f9faf8] pb-8">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-9 py-6">
      {/* Navigation */}
      <Link to={`/forms/${form.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#4a8564] hover:text-[#3d9b69] mb-8">
        <ChevronLeft size={18}/>
        Back to Analysis
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#4a8564] mb-2">Step 2 of 5</p>
            <h1 className="text-4xl font-bold tracking-tight mb-3">Review Answers</h1>
            <p className="text-[#66776d] max-w-2xl">Review each AI-generated answer, make edits, and validate before approval. Click the expand button to see which sources informed each answer.</p>
          </div>
          <a href={form.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4a8564] hover:text-[#3d9b69] whitespace-nowrap mt-1">
            <ExternalLink size={16}/>
            Original Form
          </a>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="p-4">
            <p className="text-xs text-[#66776d] mb-1">Answered</p>
            <p className="text-2xl font-bold">{answerCount}/{form.questions.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#66776d] mb-1">Validation Status</p>
            <p className={`text-sm font-semibold ${validationStatus === 'ready' ? 'text-[#2e8657]' : 'text-[#9b751d]'}`}>
              {validationStatus === 'ready' ? '✓ Ready' : '⚠ Needs Review'}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[#66776d] mb-1">Form Status</p>
            <p className="text-sm font-semibold text-[#66776d]">{submitted ? 'Submitted' : filled ? 'Filled' : 'Draft'}</p>
          </Card>
        </div>
      </div>

      {/* Answer Cards */}
      <div className="space-y-4 mb-8">
        {form.questions.map((question, index) => (
          <Card key={question.id} className="overflow-hidden hover:shadow-md transition">
            <div className="p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="grid size-6 place-items-center rounded-full bg-[#e8f5ed] text-xs font-bold text-[#3d9b69]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-base font-bold">{question.label}</h3>
                    {question.required && <Badge variant="default">Required</Badge>}
                  </div>
                  {question.source && (
                    <p className="text-xs text-[#66776d] ml-9">
                      Grounded in: <span className="font-medium">{question.source}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    question.confidence >= 0.8 ? 'success' :
                    question.confidence >= 0.5 ? 'warning' :
                    'error'
                  }>
                    {Math.round(question.confidence * 100)}%
                  </Badge>
                  <button
                    onClick={() => setExpandedSources({ ...expandedSources, [question.id]: !expandedSources[question.id] })}
                    className="text-[#66776d] hover:text-[#3d9b69]"
                  >
                    <HelpCircle size={16}/>
                  </button>
                </div>
              </div>

              {/* Source Info (Expandable) */}
              {expandedSources[question.id] && (
                <div className="mb-4 rounded-lg bg-[#f9faf8] border border-[#e5e9e2] p-4">
                  <h4 className="text-xs font-semibold text-[#4a8564] mb-2">Why this answer?</h4>
                  <p className="text-xs text-[#66776d] leading-relaxed mb-3">
                    This answer was grounded using your profile and resume data. The AI retrieved relevant information and synthesized it into a coherent response.
                  </p>
                  {question.sources && question.sources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[#4a8564]">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {question.sources.map((source, i) => (
                          <Badge key={i} variant="default">{source}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Answer Input */}
              <div className="mb-4">
                {question.type === 'long_text' ? (
                  <textarea
                    value={question.answer}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-[#dce4dc] px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 ring-[#75b992]"
                    placeholder="Enter answer..."
                  />
                ) : (
                  <input
                    value={question.answer}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    className="w-full h-10 rounded-lg border border-[#dce4dc] px-4 text-sm outline-none focus:ring-2 ring-[#75b992]"
                    placeholder="Enter answer..."
                  />
                )}
              </div>

              {/* Validation Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getValidationIcon(question.validation)}
                  <span className={`text-xs font-semibold ${
                    question.validation === 'Ready' ? 'text-[#2e8657]' :
                    question.validation?.includes('short') ? 'text-[#9b751d]' :
                    'text-[#b35d55]'
                  }`}>
                    {question.validation === 'Ready' ? 'Ready' : question.validation || 'Revalidate'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Validation & Approval Section */}
      <Card className="border-2 border-[#e8f5ed] bg-[#eff8f1] p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#d7efdf] text-[#3d9b69]">
            <ShieldCheck size={20}/>
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Review Complete</h3>
            <p className="text-sm text-[#658071] mb-4">
              {validationStatus === 'ready' 
                ? 'All answers are ready for approval. The AI assistant has grounded each response in your profile and resume.'
                : 'Some answers need attention. Review the validation messages and make edits before approving.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={validate}
                disabled={busy || submitted}
                variant="secondary"
              >
                {busy ? 'Validating...' : 'Revalidate All'}
              </Button>
              {!filled && !submitted && (
                <Button
                  onClick={fillExtension}
                  disabled={!ready || busy}
                  variant="primary"
                >
                  {busy ? 'Filling...' : '✓ Approve & Fill Form'}
                </Button>
              )}
              {filled && !submitted && (
                <Button
                  onClick={submitForm}
                  disabled={busy}
                  variant="primary"
                >
                  {busy ? 'Submitting...' : 'Submit Form'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      {notice && (
        <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-3 ${
          notice.startsWith('✓') ? 'bg-[#e7f6ec] border-[#b9dcc7] text-[#2e8657]' :
          'bg-[#fff0ee] border-[#e8c2bc] text-[#b35d55]'
        }`}>
          <span className="text-lg">{notice.startsWith('✓') ? '✓' : '✗'}</span>
          {notice.slice(2)}
        </div>
      )}
    </div>
  </div>;
}
