import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Check, RefreshCw, Music2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StarField } from '../components/ui/StarField';
import { verifyEmailToken } from '../api/auth';
import { getApiErrorMessage } from '../api/error-handling';

export default function EmailVerification() {
  const navigate = useNavigate();
  const { user, login } = useApp();
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tokenFromUrl = searchParams.get('token') || '';
  const registrationEmail = searchParams.get('email') || user?.email || 'you@example.com';

  const handleResend = async () => {
    setError('');
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  const handleVerified = useCallback(async (providedToken?: string) => {
    const verificationToken = providedToken || tokenFromUrl;
    if (!verificationToken) {
      setError('Missing verification token. Please open the email link directly.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const verifiedUser = await verifyEmailToken(verificationToken);
      login(verifiedUser.accountType);
      setSuccessMessage('Email verified successfully. Redirecting...');
      navigate('/dashboard');
    } catch (apiError: unknown) {
      const message = getApiErrorMessage(apiError, 'Unable to verify email with this link.');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [login, navigate, tokenFromUrl]);

  useEffect(() => {
    if (!tokenFromUrl) {
      return;
    }

    void handleVerified(tokenFromUrl);
  }, [handleVerified, tokenFromUrl]);

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4 relative overflow-hidden">
      <StarField count={100} />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#FFC904]/[0.03] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-10 text-center" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}>
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-[#FFC904] flex items-center justify-center">
              <Music2 className="w-4 h-4 text-[#09090B]" strokeWidth={2.5} />
            </div>
            <span
              className="text-[#FAFAFA] font-black uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem' }}
            >
              Garage Jam
            </span>
          </div>

          {/* Icon */}
          <div className="relative inline-flex mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FFC904]/10 border border-[#FFC904]/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#FFC904]" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#22C55E] border-2 border-[#111113] flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <h2 className="text-[#FAFAFA] mb-2" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Check your inbox
          </h2>
          <p className="text-[#8A8A9A] text-sm mb-1 leading-relaxed">
            We've sent a verification link to
          </p>
          <p className="text-[#FFC904] font-semibold text-sm mb-8">
            {registrationEmail}
          </p>

          <div className="space-y-4 mb-8">
            {[
              'Open your email inbox',
              'Click the verification link in the email',
              "You'll be redirected back to Garage Jam",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-left bg-[#1C1C1F] rounded-xl px-4 py-3">
                <div className="w-6 h-6 rounded-full bg-[#FFC904]/10 border border-[#FFC904]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#FFC904] font-bold" style={{ fontSize: '10px' }}>{i + 1}</span>
                </div>
                <span className="text-[#8A8A9A] text-sm">{step}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-xl px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-xl px-4 py-3 mb-4 text-sm">
              {successMessage}
            </div>
          )}

          {/* Success resent state */}
          {resent && (
            <div className="flex items-center justify-center gap-2 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-xl px-4 py-3 mb-4 text-sm">
              <Check className="w-4 h-4" />
              Verification email resent!
            </div>
          )}

          <button
            onClick={() => void handleVerified()}
            className="w-full bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] py-3 rounded-xl font-bold transition-all text-sm mb-3"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'I\'ve verified my email →'}
          </button>

          <button
            onClick={handleResend}
            disabled={loading || resent}
            className="w-full flex items-center justify-center gap-2 text-[#8A8A9A] hover:text-[#FAFAFA] py-2.5 text-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Working...' : 'Resend email'}
          </button>

          <p className="text-[#8A8A9A] text-xs mt-6 leading-relaxed">
            Check your spam folder if you don't see the email. The link expires in 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}