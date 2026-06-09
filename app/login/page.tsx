'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#0b0f14'}}>
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{backgroundColor: '#161d2b', border: '1px solid #1e293b'}}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{background: 'linear-gradient(135deg, #00b49a, #0284c7)'}}>
            AT
          </div>
          <div>
            <p className="font-semibold text-white">AMIDC Automation</p>
            <p className="text-xs" style={{color: '#64748b'}}>AR Dashboard</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-white mb-2">Sign In</h1>
        <p className="text-sm mb-6" style={{color: '#64748b'}}>Enter your dashboard password to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{color: '#94a3b8'}}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl text-white outline-none transition-all"
              style={{
                backgroundColor: '#0b0f14',
                border: '1px solid #1e293b',
                fontSize: '14px',
              }}
              onFocus={(e) => e.target.style.borderColor = '#00b49a'}
              onBlur={(e) => e.target.style.borderColor = '#1e293b'}
              required
            />
          </div>

          {error && (
            <p className="text-sm" style={{color: '#f87171'}}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-opacity"
            style={{backgroundColor: '#00b49a', opacity: loading ? 0.7 : 1}}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
