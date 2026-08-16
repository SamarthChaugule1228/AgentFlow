import { User, Mail, Phone, MapPin, Award, Briefcase, FileText, BookOpen, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button, Card, Input } from '../components/ui';
import { profileApi } from '../services/api';

export default function ProfileNew() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    profileApi.get().then(setProfile).catch(console.error);
  }, []);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleArrayChange = (field, index) => (e) => {
    const arr = formData[field] || [];
    arr[index] = e.target.value;
    setFormData(prev => ({ ...prev, [field]: [...arr] }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await profileApi.save(formData);
      setProfile(updated);
      setEditing(false);
      setFormData({});
    } catch (error) {
      console.error('Failed to save profile', error);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return <div className="grid h-96 place-items-center"><Loader className="animate-spin text-[#3d9b69]"/></div>;
  }

  const completeness = Math.round((
    (profile.full_name ? 1 : 0) +
    (profile.email ? 1 : 0) +
    (profile.education ? 1 : 0) +
    (profile.experience ? 1 : 0) +
    (profile.skills?.length > 0 ? 1 : 0)
  ) / 5 * 100);

  return (
    <div className="w-full bg-[#f9faf8] pb-8">
      <div className="w-full px-4 sm:px-5 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#4a8564] mb-3">Profile</p>
            <h1 className="text-4xl font-bold tracking-tight">Your AI Knowledge Profile</h1>
            <p className="text-[#66776d] mt-2">Manage your personal information and profile data used across form analysis</p>
          </div>
          <Button onClick={() => { setEditing(!editing); if (!editing) setFormData(profile); }} variant={editing ? 'secondary' : 'primary'}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {/* Completeness */}
        <Card className="p-6 mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Profile Completeness</h3>
            <span className="text-lg font-bold text-[#3d9b69]">{completeness}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#e5e9e2] overflow-hidden">
            <div className="h-full bg-linear-to-r from-[#3d9b69] to-[#2c8056] transition-all" style={{ width: `${completeness}%` }}/>
          </div>
        </Card>

        {/* Sections */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <div className="border-b border-[#e5e9e2] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User size={20} className="text-[#3d9b69]"/>
                <h2 className="font-bold">Personal Information</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {editing ? (
                <>
                  <Input label="Full Name" value={formData.full_name || profile.full_name} onChange={handleInputChange('full_name')}/>
                  <Input label="Email" type="email" value={formData.email || profile.email} onChange={handleInputChange('email')}/>
                  <Input label="Phone" value={formData.phone || profile.phone} onChange={handleInputChange('phone')}/>
                  <Input label="Location" value={formData.location || profile.location} onChange={handleInputChange('location')}/>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#66776d] mb-1">Full Name</p>
                    <p className="font-semibold">{profile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#66776d] mb-1">Email</p>
                    <p className="font-semibold">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#66776d] mb-1">Phone</p>
                    <p className="font-semibold">{profile.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#66776d] mb-1">Location</p>
                    <p className="font-semibold">{profile.location}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Education */}
          <Card>
            <div className="border-b border-[#e5e9e2] px-6 py-4 flex items-center gap-3">
              <BookOpen size={20} className="text-[#3d9b69]"/>
              <h2 className="font-bold">Education</h2>
            </div>
            <div className="p-6">
              {editing ? (
                <Input label="Education" value={formData.education || profile.education} onChange={handleInputChange('education')} placeholder="B.Tech in Computer Science"/>
              ) : (
                <p className="text-sm">{profile.education}</p>
              )}
            </div>
          </Card>

          {/* Experience */}
          <Card>
            <div className="border-b border-[#e5e9e2] px-6 py-4 flex items-center gap-3">
              <Briefcase size={20} className="text-[#3d9b69]"/>
              <h2 className="font-bold">Experience</h2>
            </div>
            <div className="p-6">
              {editing ? (
                <Input label="Experience" value={formData.experience || profile.experience} onChange={handleInputChange('experience')} placeholder="Built web applications with React and Node.js..."/>
              ) : (
                <p className="text-sm text-[#66776d] leading-relaxed">{profile.experience}</p>
              )}
            </div>
          </Card>

          {/* Skills */}
          <Card>
            <div className="border-b border-[#e5e9e2] px-6 py-4 flex items-center gap-3">
              <Award size={20} className="text-[#3d9b69]"/>
              <h2 className="font-bold">Skills</h2>
            </div>
            <div className="p-6">
              {editing ? (
                <div className="space-y-3">
                  {(formData.skills || profile.skills || []).map((skill, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={skill}
                        onChange={handleArrayChange('skills', i)}
                        className="flex-1 rounded-lg border border-[#dce4dc] px-3 h-10 text-sm outline-none focus:ring-2 ring-[#75b992]"
                        placeholder="e.g., React"
                      />
                      <button onClick={() => removeArrayItem('skills', i)} className="text-[#b14b48] hover:text-[#9b3f3c]">✕</button>
                    </div>
                  ))}
                  <Button onClick={() => addArrayItem('skills')} variant="secondary" size="sm" className="w-full">+ Add Skill</Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-[#e8f5ed] text-[#3d9b69] px-3 py-1 text-xs font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Save Button */}
          {editing && (
            <Button onClick={handleSave} disabled={saving} variant="primary" size="lg" className="w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
