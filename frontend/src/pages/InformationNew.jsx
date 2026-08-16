import { Upload, FileText, CheckCircle2, Loader, Trash2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { Button, Card, Input } from '../components/ui';
import { documentApi, profileApi } from '../services/api';

export default function InformationNew() {
  const [profile, setProfile] = useState(null);
  const [learningMethod, setLearningMethod] = useState('upload');
  const [savingManualInfo, setSavingManualInfo] = useState(false);
  const [manualInfoSaved, setManualInfoSaved] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const docs = profile?.uploaded_documents || [];
  const fileInputRef = useRef(null);

  useEffect(() => {
    profileApi.get().then(setProfile).catch(console.error);
  }, []);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('');
    try {
      await documentApi.upload(file);
      setUploadStatus('Document uploaded successfully.');
      const refreshed = await profileApi.get();
      setProfile(refreshed);
      setFormData({});
    } catch (error) {
      console.error('Failed to upload document', error);
      setUploadStatus('Unable to upload document. Please try again.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSaveManualInfo = async () => {
    setSavingManualInfo(true);
    try {
      const extraInfo = formData.extra_info || profile.extra_info || '';
      const updated = await profileApi.save({ extra_info: extraInfo });
      setProfile(updated);
      setFormData({});
      setManualInfoSaved(true);
      setTimeout(() => setManualInfoSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save manual info', error);
    } finally {
      setSavingManualInfo(false);
    }
  };

  if (!profile) {
    return <div className="grid h-96 place-items-center"><Loader className="animate-spin text-[#3d9b69]"/></div>;
  }

  return (
    <div className="w-full bg-[#f9faf8] pb-8">
      <div className="w-full px-4 sm:px-5 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#4a8564] mb-3">Information</p>
          <h1 className="text-4xl font-bold tracking-tight">Manage Your Knowledge</h1>
          <p className="text-[#66776d] mt-2">Upload documents or enter information manually. Your data is stored and used when generating answers.</p>
        </div>

        <div className="space-y-6">
          {/* Learning Method Choice */}
          <Card className="p-6">
            <h3 className="mb-5 text-xl font-bold text-[#1f3a2c]">How should AgentFlow learn about you?</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setLearningMethod('upload');
                  fileInputRef.current?.click();
                }}
                className={`rounded-2xl border p-5 text-left transition ${learningMethod === 'upload' ? 'border-[#3d9b69] bg-[#eef8f1] shadow-sm' : 'border-[#dfe8e1] bg-[#f9faf8] hover:border-[#99c5a7]'}`}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e2f2e7] text-[#256b47]">
                  <Upload size={20} />
                </div>
                <p className="text-lg font-bold text-[#1f3a2c]">Upload Resume</p>
                <p className="mt-1 text-sm text-[#66776d]">Upload your resume<br />or other documents</p>
              </button>

              <button
                type="button"
                onClick={() => setLearningMethod('manual')}
                className={`rounded-2xl border p-5 text-left transition ${learningMethod === 'manual' ? 'border-[#3d9b69] bg-[#eef8f1] shadow-sm' : 'border-[#dfe8e1] bg-[#f9faf8] hover:border-[#99c5a7]'}`}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e2f2e7] text-[#256b47]">
                  <FileText size={20} />
                </div>
                <p className="text-lg font-bold text-[#1f3a2c]">Enter Information</p>
                <p className="mt-1 text-sm text-[#66776d]">Add your information<br />manually</p>
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleDocumentUpload}/>

            {learningMethod === 'manual' && (
              <div className="mt-5 rounded-xl border border-[#dfe8e1] bg-[#f6faf7] p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4a8564]">Manual details</p>
                <p className="mb-3 text-xs text-[#66776d]">Add your education, experience, skills, preferred role, or anything missing from your resume.</p>
                <textarea
                  value={formData.extra_info || profile.extra_info || ''}
                  onChange={handleInputChange('extra_info')}
                  className="min-h-[130px] w-full rounded-lg border border-[#dce4dc] bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-[#75b992]"
                  placeholder="E.g., B.Tech Computer Science, 2 years at TCS, skilled in React and Node.js..."
                />
                <button
                  onClick={handleSaveManualInfo}
                  disabled={savingManualInfo}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-[#3d9b69] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2d7956] disabled:opacity-50"
                >
                  {manualInfoSaved ? (
                    <>
                      <CheckCircle2 size={18} />
                      Saved
                    </>
                  ) : savingManualInfo ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Information'
                  )}
                </button>
              </div>
            )}

            {learningMethod === 'upload' && uploadStatus && (
              <div className="mt-4 rounded-lg bg-[#e8f5ed] p-3 text-sm text-[#3d9b69]">
                {uploadStatus}
              </div>
            )}
          </Card>

          {/* Current Manual Info */}
          {profile.extra_info && learningMethod === 'manual' && (
            <Card>
              <div className="border-b border-[#e5e9e2] px-6 py-4">
                <h2 className="font-bold">Current Information Stored</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-[#475a52] whitespace-pre-wrap">{profile.extra_info}</p>
              </div>
            </Card>
          )}

          {/* Uploaded Documents */}
          <Card>
            <div className="border-b border-[#e5e9e2] px-6 py-4 flex items-center gap-3">
              <FileText size={20} className="text-[#3d9b69]"/>
              <h2 className="font-bold">Uploaded Documents</h2>
              {docs.length > 0 && (
                <span className="ml-auto inline-flex items-center rounded-full bg-[#e8f5ed] px-2.5 py-0.5 text-xs font-semibold text-[#3d9b69]">
                  {docs.length}
                </span>
              )}
            </div>
            <div className="p-6">
              {docs.length ? (
                <ul className="space-y-2">
                  {docs.map((doc) => (
                    <li key={doc.id || doc.filename} className="flex items-center justify-between rounded-lg border border-[#e4ece5] bg-[#f7faf8] px-4 py-3">
                      <div className="flex-1">
                        <p className="font-medium text-[#2d473c]">{doc.filename}</p>
                        <p className="text-xs text-[#66776d] mt-1">{doc.content_type || 'document'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#66776d]">No documents uploaded yet. Start by uploading a resume or other documents.</p>
              )}
            </div>
          </Card>

          {/* Info Box */}
          <Card className="bg-[#f6faf7] border border-[#dfe8e1]">
            <div className="p-6">
              <h3 className="font-bold text-[#256b47] mb-2">💡 How Your Information is Used</h3>
              <p className="text-sm text-[#475a52] leading-relaxed">
                When you fill out forms, AgentFlow searches through your uploaded documents and manually entered information to provide accurate, personalized answers. Documents are extracted and indexed, while manual information serves as a fallback when documents are incomplete.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
