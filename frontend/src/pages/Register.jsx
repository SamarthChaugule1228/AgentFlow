import { ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../services/api';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError('');
    
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await authApi.register(fullName, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleRegister();
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f3] p-6">
      <section className="w-full max-w-sm rounded-2xl border border-[#e1e8e1] bg-white p-8 shadow-xl shadow-[#1b342308]">
        <div className="flex items-center gap-2 text-xl font-bold tracking-[-1px]">
          <span className="grid size-8 place-items-center rounded-lg bg-[#183126] text-[#b9f0d1]">
            <FileText size={17}/>
          </span>
          Agent<span className="text-[#3d9b69]">Flow</span>
        </div>

        <h1 className="mt-9 text-2xl font-bold tracking-[-.8px]">Create account</h1>
        <p className="mt-2 text-sm text-[#718177]">Join and start automating your forms with AI.</p>

        {error && (
          <div className="mt-4 rounded-lg bg-[#fff0ee] border border-[#e8c2bc] p-3 text-xs text-[#b35d55]">
            {error}
          </div>
        )}

        <label className="mt-6 block text-xs font-semibold text-[#506258]">
          Full Name
          <input 
            value={fullName} 
            onChange={e => setFullName(e.target.value)}
            onKeyPress={handleKeyPress}
            type="text" 
            placeholder="John Doe" 
            className="mt-2 h-11 w-full rounded-lg border border-[#dce5dc] px-3 text-sm outline-none focus:ring-2 focus:ring-[#75b992]"
          />
        </label>

        <label className="mt-4 block text-xs font-semibold text-[#506258]">
          Email
          <input 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            type="email" 
            placeholder="you@example.com" 
            className="mt-2 h-11 w-full rounded-lg border border-[#dce5dc] px-3 text-sm outline-none focus:ring-2 focus:ring-[#75b992]"
          />
        </label>

        <label className="mt-4 block text-xs font-semibold text-[#506258]">
          Password
          <input 
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            type="password" 
            placeholder="••••••••" 
            className="mt-2 h-11 w-full rounded-lg border border-[#dce5dc] px-3 text-sm outline-none focus:ring-2 focus:ring-[#75b992]"
          />
        </label>

        <label className="mt-4 block text-xs font-semibold text-[#506258]">
          Confirm Password
          <input 
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            type="password" 
            placeholder="••••••••" 
            className="mt-2 h-11 w-full rounded-lg border border-[#dce5dc] px-3 text-sm outline-none focus:ring-2 focus:ring-[#75b992]"
          />
        </label>

        <button 
          onClick={handleRegister}
          disabled={loading}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3d9b69] text-sm font-bold text-white disabled:opacity-60 hover:bg-[#32845a] transition"
        >
          {loading ? 'Creating account...' : <>Create Account <ArrowRight size={16}/></>}
        </button>

        <p className="mt-4 text-center text-xs text-[#78877e]">
          Already have an account? 
          <button 
            onClick={() => navigate('/login')}
            className="ml-1 font-semibold text-[#3e865c] hover:text-[#32845a] transition"
          >
            Sign in
          </button>
        </p>

        <button 
          onClick={() => {
            setFullName('John Doe');
            setEmail('demo@example.com');
            setPassword('demo12345');
            setConfirmPassword('demo12345');
            setTimeout(() => handleRegister(), 100);
          }}
          className="mt-4 block w-full text-center text-xs font-semibold text-[#3e865c] hover:text-[#32845a] transition"
        >
          Try demo account →
        </button>
      </section>
    </main>
  );
}
