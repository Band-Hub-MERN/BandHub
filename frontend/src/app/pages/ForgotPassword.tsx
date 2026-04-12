import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, AlertCircle, CheckCircle2, Mail, Music2 } from 'lucide-react';
import { requestPasswordReset } from '../api/auth';
import { getApiErrorMessage, hasApiResponse } from '../api/error-handling';
import { StarField } from '../components/ui/StarField';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const message = await requestPasswordReset(email);
      setSuccessMessage(message || 'If an account with that email exists, a password reset link has been sent.');
    } catch (apiError: unknown) {
      if (!hasApiResponse(apiError)) {
        setError('Unable to reach the server. Make sure the backend API is running on port 5001.');
      } else {
        const message = getApiErrorMessage(apiError, '');
        setError(message || 'Unable to send a password reset email right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4 relative overflow-hidden">
      <StarField count={120} />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#FFC904]/[0.04] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-[#8A8A9A] hover:text-[#FAFAFA] mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </button>

        <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-8" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}>
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

          <div className="w-14 h-14 rounded-2xl bg-[#FFC904]/10 border border-[#FFC904]/20 flex items-center justify-center mb-6">
            <Mail className="w-6 h-6 text-[#FFC904]" />
          </div>

          <h2 className="text-[#FAFAFA] mb-1.5" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Reset your password
          </h2>
          <p className="text-[#8A8A9A] text-sm mb-7 leading-relaxed">
            Enter the email tied to your account and we&apos;ll send you a reset link.
          </p>

          {error && (
            <div className="flex items-center gap-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-xl px-4 py-3 mb-5 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>{successMessage}</p>
                <p className="text-[#8ED6A2] mt-1">If mail is not configured in development, the backend logs the reset link in the server console.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFC904] hover:bg-[#FFD84D] disabled:opacity-60 text-[#09090B] py-3 rounded-xl font-bold transition-all text-sm"
            >
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#8A8A9A] text-sm">
              Remembered it?{' '}
              <Link to="/login" className="text-[#FFC904] font-semibold hover:underline">Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
