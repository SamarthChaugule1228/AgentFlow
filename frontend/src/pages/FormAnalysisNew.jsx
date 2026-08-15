import { ArrowRight, CheckCircle2, CircleAlert, LoaderCircle, Sparkles, BarChart3, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { formApi } from '../services/api';
import { Button, Card } from '../components/ui';

export default function FormAnalysisNew() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [generationSteps, setGenerationSteps] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    formApi.get(formId).then(setForm).catch(() => setError('Form session not found'));
  }, [formId]);

  const generate = async () => {
    if (!form) return;
    setBusy(true);
    setGenerationSteps([
      { step: 'Analyzing questions', status: 'in-progress', icon: FileText },
      { step: 'Retrieving your profile', status: 'pending', icon: CheckCircle2 },
      { step: 'Searching documents', status: 'pending', icon: CheckCircle2 },
      { step: 'Generating answers', status: 'pending', icon: CheckCircle2 },
      { step: 'Validating responses', status: 'pending', icon: CheckCircle2 },
    ]);
    try {
      // Simulate progress
      await new Promise(r => setTimeout(r, 800));
      setGenerationSteps(s => s.map((st, i) => ({ ...st, status: i < 2 ? 'complete' : i === 1 ? 'in-progress' : 'pending' })));
      
      await new Promise(r => setTimeout(r, 800));
      setGenerationSteps(s => s.map((st, i) => ({ ...st, status: i < 3 ? 'complete' : i === 2 ? 'in-progress' : 'pending' })));
      
      await new Promise(r => setTimeout(r, 800));
      setGenerationSteps(s => s.map((st, i) => ({ ...st, status: i < 4 ? 'complete' : i === 3 ? 'in-progress' : 'pending' })));
      
      await new Promise(r => setTimeout(r, 800));
      setGenerationSteps(s => s.map((st, i) => ({ ...st, status: i < 5 ? 'complete' : 'in-progress' })));
      
      await new Promise(r => setTimeout(r, 400));
      const result = await formApi.generate(form.id, form.questions);
      setGenerationSteps(s => s.map(st => ({ ...st, status: 'complete' })));
      setForm(result);
      await new Promise(r => setTimeout(r, 600));
      navigate(`/forms/${form.id}/review`);
    } catch (err) {
      setError('Failed to generate answers');
    } finally {
      setBusy(false);
    }
  };

  if (error) return (
    <div className="min-h-screen bg-[#f9faf8] flex items-center justify-center p-4">
      <Card className="max-w-md">
        <div className="p-8 text-center">
          <CircleAlert size={40} className="mx-auto mb-4 text-[#b35d55]"/>
          <h2 className="font-bold mb-2">Error Loading Form</h2>
          <p className="text-sm text-[#66776d] mb-6">{error}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3d9b69] hover:text-[#2c8056]">
            ← Return to Dashboard
          </Link>
        </div>
      </Card>
    </div>
  );

  if (!form) return (
    <div className="min-h-screen bg-[#f9faf8] flex items-center justify-center">
      <div className="text-center">
        <LoaderCircle className="animate-spin mx-auto mb-4 text-[#3d9b69] size-8"/>
        <p className="text-[#66776d]">Loading form...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9faf8] pb-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-9 py-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#4a8564] mb-3">Step 1 of 5</p>
          <div className="flex items-start justify-between gap-6 mb-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">Form Analysis</h1>
              <p className="text-[#66776d] max-w-2xl">
                We found <span className="font-semibold">{form.questions.length} questions</span> in your form. Review the structure and questions below, then generate AI-powered answers.
              </p>
            </div>
            <div className="rounded-lg bg-[#e8f5ed] px-3 py-2 text-xs font-semibold text-[#3d9b69] whitespace-nowrap">
              📋 {form.mode === 'live' ? 'Live Extraction' : 'Preview'}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Questions List */}
          <div>
            <Card>
              <div className="border-b border-[#e5e9e2] px-6 py-4">
                <p className="text-xs text-[#66776d] font-medium">{form.url}</p>
              </div>
              <div className="divide-y divide-[#e5e9e2]">
                {form.questions.map((question, index) => (
                  <div key={question.id} className="p-6 hover:bg-[#f9faf8] transition">
                    <div className="flex gap-4">
                      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8f5ed] text-xs font-bold text-[#3d9b69]">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold">{question.label}</h3>
                          {question.required && <span className="text-xs text-[#b35d55]">Required</span>}
                        </div>
                        <p className="text-xs text-[#66776d] capitalize mb-2">
                          {question.type.replace('_', ' ')}
                        </p>
                        {question.options?.length > 0 && (
                          <p className="text-xs text-[#66776d] wrap-break-word">
                            <span className="font-medium">Options:</span> {question.options.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Generation Panel */}
            <Card className="border-2 border-[#e8f5ed] bg-[#eff8f1]">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-[#d7efdf]">
                    <Sparkles size={20} className="text-[#3d9b69]"/>
                  </div>
                  <div>
                    <h3 className="font-bold">Generate Answers</h3>
                    <p className="text-xs text-[#658071]">AI-powered</p>
                  </div>
                </div>

                <p className="text-xs text-[#658071] mb-6 leading-relaxed">
                  AgentFlow will classify each question, retrieve your profile data and documents, draft grounded answers, and validate them.
                </p>

                <Button
                  onClick={generate}
                  disabled={busy}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  {busy ? 'Generating...' : <>Generate Drafts <ArrowRight size={16}/></>}
                </Button>

                <div className="mt-4 text-xs text-[#658071] flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0"/>
                  <span>You can edit every answer before approval</span>
                </div>
              </div>
            </Card>

            {/* Stats */}
            <Card className="p-6">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-[#66776d] mb-1">Total Questions</p>
                  <p className="text-2xl font-bold">{form.questions.length}</p>
                </div>
                <div>
                  <p className="text-xs text-[#66776d] mb-1">Required Fields</p>
                  <p className="text-2xl font-bold">{form.questions.filter(q => q.required).length}</p>
                </div>
                <div>
                  <p className="text-xs text-[#66776d] mb-1">Question Types</p>
                  <p className="text-sm text-[#4a8564]">
                    {new Set(form.questions.map(q => q.type.replace('_', ' '))).size} types
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Generation Progress */}
        {busy && generationSteps.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md">
              <div className="p-8">
                <h3 className="font-bold mb-6 text-center">Generating Answers</h3>
                <div className="space-y-3">
                  {generationSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`shrink-0 ${
                        step.status === 'complete' ? 'text-[#2e8657]' :
                        step.status === 'in-progress' ? 'text-[#3d9b69]' :
                        'text-[#d4e4d8]'
                      }`}>
                        {step.status === 'complete' && <CheckCircle2 size={18}/>}
                        {step.status === 'in-progress' && <LoaderCircle size={18} className="animate-spin"/>}
                        {step.status === 'pending' && <Circle size={18}/>}
                      </div>
                      <span className="text-sm flex-1">{step.step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Circle({ size = 24, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );
}
