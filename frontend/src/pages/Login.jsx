import { ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    if (!email) {
      setError('Please enter email');
      return;
    }
    if (!password) {
      setPassword('demo123'); // Use default demo password
    }
    setLoading(true);
    try {
      await authApi.login(email, password || 'demo123');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
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

        <h1 className="mt-9 text-2xl font-bold tracking-[-.8px]">Welcome back</h1>
        <p className="mt-2 text-sm text-[#718177]">Sign in to your private application workspace.</p>

        {error && (
          <div className="mt-4 rounded-lg bg-[#fff0ee] border border-[#e8c2bc] p-3 text-xs text-[#b35d55]">
            {error}
          </div>
        )}

        <label className="mt-6 block text-xs font-semibold text-[#506258]">
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

        <button 
          onClick={handleLogin}
          disabled={!email || loading}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3d9b69] text-sm font-bold text-white disabled:opacity-60 hover:bg-[#32845a] transition"
        >
          {loading ? 'Signing in...' : <>Continue <ArrowRight size={16}/></>}
        </button>

        <p className="mt-4 text-center text-xs text-[#78877e]">Demo mode — use any email.</p>

        <p className="mt-4 text-center text-xs text-[#78877e]">
          Don't have an account? 
          <button 
            onClick={() => navigate('/register')}
            className="ml-1 font-semibold text-[#3e865c] hover:text-[#32845a] transition"
          >
            Sign up
          </button>
        </p>

        <button 
          onClick={() => {
            setEmail('demo@example.com');
            setPassword('demo123');
            setTimeout(() => handleLogin(), 100);
          }}
          className="mt-4 block w-full text-center text-xs font-semibold text-[#3e865c] hover:text-[#32845a] transition"
        >
          Try demo account →
        </button>
      </section>
    </main>
  );
}
