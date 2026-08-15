import { FileText, Calendar, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '../components/ui';
import { formApi } from '../services/api';

export default function HistoryNew() {
  const [forms, setForms] = useState([]);

  useEffect(() => {
    formApi.history().then((items = []) => {
      const mapped = items.map((form) => ({
        id: form.id,
        title: form.url || 'Form Submission',
        date: form.updated_at ? new Date(form.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
        questions: Array.isArray(form.questions) ? form.questions.length : 0,
        answered: Array.isArray(form.questions) ? form.questions.filter((q) => q?.answer).length : 0,
        status: form.status === 'filled' ? 'filled' : form.status === 'submitted' ? 'submitted' : 'draft',
      }));
      setForms(mapped);
    }).catch(() => setForms([]));
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-[#e7f6ec] text-[#2e8657]',
      filled: 'bg-[#fff5dc] text-[#9b751d]',
      draft: 'bg-[#f0f4f2] text-[#5a7166]'
    };
    const labels = {
      submitted: '✓ Submitted',
      filled: '⟳ Filled',
      draft: '● Draft'
    };
    return { styles: styles[status], label: labels[status] };
  };

  return (
    <div className="w-full bg-[#f9faf8] pb-8">
      <div className="w-full px-4 sm:px-5 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#4a8564] mb-3">History</p>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Form Submissions</h1>
          <p className="text-[#66776d]">Track all your analyzed, filled, and submitted forms</p>
        </div>

        {/* Forms Table */}
        {forms.length > 0 ? (
          <div className="space-y-3">
            {forms.map((form) => (
              <Card key={form.id} className="p-6 hover:shadow-md transition cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={18} className="text-[#3d9b69] shrink-0"/>
                      <h3 className="font-semibold text-lg">{form.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-[#66776d]">
                      <span className="flex items-center gap-1">
                        <Calendar size={14}/>
                        {form.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14}/>
                        {form.answered}/{form.questions} questions
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusBadge(form.status).styles}`}>
                    {getStatusBadge(form.status).label}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-[#d4e4d8]"/>
            <h3 className="font-semibold mb-1">No submissions yet</h3>
            <p className="text-sm text-[#66776d]">Start by analyzing a Google Form</p>
          </Card>
        )}
      </div>
    </div>
  );
}
