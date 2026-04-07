import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Music2, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StarField } from '../components/ui/StarField';
import { loginRequest } from '../api/auth';
import { getApiErrorMessage, hasApiResponse } from '../api/error-handling';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const authenticatedUser = await loginRequest(email, password);
      login(authenticatedUser.accountType);
      navigate('/dashboard');
    } catch (error: unknown) {
      if (!hasApiResponse(error)) {
        setError('Unable to reach the server. Make sure the backend API is running on port 5001.');
      } else {
        const apiError = getApiErrorMessage(error, '');
        setError(apiError || 'Unable to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <StarField count={120} />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#FFC904]/[0.04] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[#8A8A9A] hover:text-[#FAFAFA] mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </button>

        {/* Card */}
        <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-8" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}>
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#FFC904] flex items-center justify-center">
              <Music2 className="w-4.5 h-4.5 text-[#09090B]" strokeWidth={2.5} />
            </div>
            <div>
              <p
                className="text-[#FAFAFA] font-black tracking-wider uppercase"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem' }}
              >
                Garage Jam
              </p>
              <p className="text-[10px] text-[#FFC904] font-bold tracking-wider uppercase">UCF Platform</p>
            </div>
          </div>

          <h2 className="text-[#FAFAFA] mb-1.5" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Welcome back</h2>
          <p className="text-[#8A8A9A] text-sm mb-7">Sign in to your Garage Jam account</p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[#FAFAFA] text-xs font-semibold mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] placeholder:text-[#8A8A9A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[#FAFAFA] text-xs font-semibold uppercase tracking-wider">Password</label>
                <button type="button" className="text-[#FFC904] text-xs hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] placeholder:text-[#8A8A9A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A9A] hover:text-[#FAFAFA] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-[#1C1C1F] accent-[#FFC904]" />
              <span className="text-[#8A8A9A] text-sm">Remember me for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFC904] hover:bg-[#FFD84D] disabled:opacity-60 text-[#09090B] py-3 rounded-xl font-bold transition-all text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#09090B]/30 border-t-[#09090B] rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#8A8A9A] text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#FFC904] font-semibold hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}