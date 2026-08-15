import { ArrowRight, FileText, Lock, Sparkles, Upload, ArrowUpRight, Clock, CheckCircle2, X, PlayCircle, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formApi } from '../services/api';
import { Button, Card } from '../components/ui';

export default function DashboardNew() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recentForms, setRecentForms] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('agentflow-guide-seen') === 'true';
    if (!hasSeenGuide) {
      setShowGuide(true);
      localStorage.setItem('agentflow-guide-seen', 'true');
    }
  }, []);

  const extractQuestions = () => new Promise((resolve, reject) => {
    const extensionId = import.meta.env.VITE_EXTENSION_ID;
    if (!extensionId || !window.chrome?.runtime) {
      reject(new Error('Install the AgentFlow Chrome extension first.'));
      return;
    }
    window.chrome.runtime.sendMessage(extensionId, { type: 'AGENTFLOW_EXTRACT', formUrl: url }, response => {
      const message = window.chrome.runtime.lastError?.message || response?.message;
      if (message || !response?.questions?.length) reject(new Error(message || 'Could not extract questions. Make sure you\'re on a Google Form.'));
      else resolve(response.questions);
    });
  });

  const analyze = async () => {
    setError('');
    setBusy(true);
    try {
      const questions = await extractQuestions();
      const form = await formApi.analyze(url, questions);
      navigate(`/forms/${form.id}`);
    } catch (err) {
      setError(err.message || 'Failed to analyze form');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const fallback = [
      { id: '1', title: 'Google Summer Internship', questions: 12, date: '2 hours ago', status: 'submitted' },
      { id: '2', title: 'Microsoft Campus Hiring', questions: 8, date: '1 day ago', status: 'filled' },
      { id: '3', title: 'Amazon SDE Interview', questions: 15, date: '3 days ago', status: 'draft' },
    ];

    formApi.history().then((forms = []) => {
      const mapped = forms.slice(0, 3).map((form) => ({
        id: form.id,
        title: form.url || 'Form Submission',
        questions: Array.isArray(form.questions) ? form.questions.length : 0,
        date: form.updated_at ? new Date(form.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
        status: form.status === 'filled' ? 'filled' : form.status === 'submitted' ? 'submitted' : 'draft',
      }));
      setRecentForms(mapped.length ? mapped : fallback);
    }).catch(() => setRecentForms(fallback));
  }, []);

  return <div className="w-full bg-[#f9faf8]">
    <div className="w-full px-4 sm:px-5 lg:px-6 py-4">
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1e18]/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#dfe9e2] bg-white shadow-[0_30px_80px_rgba(18,35,27,0.20)] animate-[fadeIn_0.22s_ease-out]">
            <div className="flex items-center justify-between border-b border-[#edf1ee] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-[#e8f5ed] text-[#2c8056]">
                  <Wand2 size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#4a8564]">How it works</p>
                  <h3 className="text-lg font-bold text-[#193026]">AgentFlow quick guide</h3>
                </div>
              </div>
              <button onClick={() => setShowGuide(false)} className="rounded-full p-2 text-[#66776d] transition hover:bg-[#f3f7f4] hover:text-[#193026]" aria-label="Close guide">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
              <div className="rounded-2xl border border-[#e7efe9] bg-[#f7faf8] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f5ed] px-3 py-1.5 text-xs font-semibold text-[#2d7c52]">
                    <Sparkles size={14} />
                    AI workflow
                  </div>
                  <span className="text-xs font-medium text-[#66776d]">Live preview</span>
                </div>

                <div className="rounded-2xl border border-[#dfe9e2] bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#f4f9f5] p-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#3d9b69]" />
                    <div className="h-2.5 flex-1 rounded-full bg-[#dfeae2]" />
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-[#e2e9e2] bg-[#f8fbf9] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c7c74]">Form URL</p>
                      <p className="mt-2 text-sm font-medium text-[#193026]">docs.google.com/forms/...</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#dfeae2] bg-[#eff8f1] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4a8564]">Profile</p>
                        <p className="mt-2 text-sm font-medium text-[#193026]">Resume + skills</p>
                      </div>
                      <div className="rounded-xl border border-[#dfeae2] bg-[#fff9ee] p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a57726]">Draft</p>
                        <p className="mt-2 text-sm font-medium text-[#193026]">Ready to review</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#dfeae2] bg-[#eef5ff] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4d72b8]">Approval</p>
                        <span className="rounded-full bg-[#dfeeff] px-2 py-1 text-[10px] font-semibold text-[#375d9b]">2 min</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#dfe9f7]">
                        <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#6aa6ff] to-[#3f7cf2]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="mb-4 flex items-center gap-2 text-[#193026]">
                  <PlayCircle size={18} className="text-[#3d9b69]" />
                  <p className="text-sm font-semibold">What to expect</p>
                </div>

                <div className="space-y-4">
                  {[
                    { title: '1. Paste a form link', text: 'Drop in any public or signed-in Google Form URL.' },
                    { title: '2. Agent reads your profile', text: 'It pulls your resume details, skills, and experience.' },
                    { title: '3. Draft answers securely', text: 'AI creates grounded answers for review before approval.' },
                    { title: '4. Fill or submit with control', text: 'You can approve, edit, or send the form directly from here.' }
                  ].map((item) => (
                    <div key={item.title} className="flex gap-3 rounded-2xl border border-[#edf1ee] bg-[#f8faf8] p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
                      <div className="mt-1 grid size-7 place-items-center rounded-full bg-[#e8f5ed] text-[#2d7c52]">
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <p className="font-semibold text-[#193026]">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[#66776d]">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={() => setShowGuide(false)} variant="primary" size="lg" className="mt-6 w-full justify-center">
                  <Upload size={18} />
                  <span>Start analyzing</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="mb-8">
        <div className="relative w-full overflow-hidden rounded-2xl bg-linear-to-br from-[#193126] to-[#2d7c52] px-6 py-12 text-white sm:px-8 lg:px-10 lg:py-14">
          <div className="absolute -right-20 -top-20 size-96 rounded-full bg-[#3d9b69]/20 blur-3xl"/>
          <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-[#2c8056]/20 blur-3xl"/>
          
          <div className="relative w-full max-w-[1200px]">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 mb-6 border border-white/20">
              <Sparkles size={16}/>
              <span className="text-sm font-semibold">AI-Powered Form Assistant</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight mb-4 md:text-5xl lg:text-6xl">
              Automate Repetitive Forms
            </h1>
            <p className="text-base text-white/80 mb-8 max-w-3xl leading-relaxed md:text-lg">
              Paste any Google Form URL. AgentFlow intelligently retrieves your profile data, generates accurate answers grounded in your resume, and fills the form with your approval.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" size="lg" className="border border-white/40 bg-white text-[#193126] shadow-[0_12px_30px_rgba(0,0,0,0.12)] hover:bg-[#f4f7f3]">
                <Upload size={18}/>
                <span>Start Now</span>
              </Button>
              <Button variant="secondary" size="lg" className="border-white/30 bg-white/5 text-white hover:bg-white/10" onClick={() => setShowGuide(true)}>
                Guide Me
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 text-sm border-t border-white/20 pt-8">
              <div>
                <div className="font-semibold text-2xl mb-1">500+</div>
                <div className="text-white/70 text-xs">Forms Automated</div>
              </div>
              <div>
                <div className="font-semibold text-2xl mb-1">98%</div>
                <div className="text-white/70 text-xs">Accuracy Rate</div>
              </div>
              <div>
                <div className="font-semibold text-2xl mb-1">2 min</div>
                <div className="text-white/70 text-xs">Avg per Form</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Form Card */}
      <section className="mb-8">
        <div className="rounded-2xl border border-[#e5e9e2] bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-[#e8f5ed]">
              <FileText size={20} className="text-[#3d9b69]"/>
            </div>
            <div>
              <h2 className="font-bold">Analyze a New Form</h2>
              <p className="text-sm text-[#66776d]">Paste a public or signed-in Google Forms URL</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyze()}
              placeholder="https://docs.google.com/forms/d/..."
              className="h-12 flex-1 rounded-lg border border-[#dce4dc] px-4 text-sm outline-none focus:ring-2 ring-[#75b992]"
            />
            <Button
              onClick={analyze}
              disabled={busy || !url}
              size="lg"
              variant="primary"
            >
              {busy ? 'Analyzing...' : <>Analyze Form <ArrowRight size={16}/></>}
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 rounded-lg bg-[#fff0ee] border border-[#e8c2bc] text-[#b35d55] px-4 py-3 text-sm flex items-center gap-2">
              <span>⚠</span>
              {error}
            </div>
          )}

          <div className="mt-4 text-xs text-[#66776d] flex items-center gap-2">
            <Lock size={14}/>
            Your data stays private. No forms are submitted without your approval.
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Recent Forms</h2>
            <p className="text-sm text-[#66776d]">Your recent form submissions and drafts</p>
          </div>
        </div>

        {recentForms.length > 0 ? (
          <div className="space-y-3">
            {recentForms.map((form) => (
              <div
                key={form.id}
                className="group rounded-xl border border-[#e5e9e2] bg-white p-4 hover:border-[#d0ddd6] transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={18} className="text-[#3d9b69] shrink-0"/>
                      <h3 className="font-semibold">{form.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#66776d]">
                      <span className="flex items-center gap-1">
                        <Clock size={14}/>
                        {form.date}
                      </span>
                      <span>{form.questions} questions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                      form.status === 'submitted' ? 'bg-[#e7f6ec] text-[#2e8657]' :
                      form.status === 'filled' ? 'bg-[#fff5dc] text-[#9b751d]' :
                      'bg-[#f0f4f2] text-[#5a7166]'
                    }`}>
                      {form.status === 'submitted' && <CheckCircle2 size={14}/>}
                      {form.status === 'submitted' ? 'Submitted' : form.status === 'filled' ? 'Filled' : 'Draft'}
                    </div>
                    <ArrowUpRight size={16} className="text-[#66776d] group-hover:translate-x-1 group-hover:-translate-y-1 transition"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#e5e9e2] bg-white p-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-[#d4e4d8]"/>
            <h3 className="font-semibold mb-1">No forms yet</h3>
            <p className="text-sm text-[#66776d]">Analyze your first form to get started</p>
          </div>
        )}
      </section>
    </div>
  </div>;
}
