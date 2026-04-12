import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, AlertCircle, Check, Eye, EyeOff, KeyRound, Music2 } from 'lucide-react';
import { completePasswordReset } from '../api/auth';
import { getApiErrorDetails, getApiErrorMessage, hasApiResponse } from '../api/error-handling';
import { StarField } from '../components/ui/StarField';

function getPasswordPolicyChecks(value: string) {
  return {
    hasMinLength: value.length >= 8,
    hasUppercase: /[A-Z]/.test(value),
    hasNumber: /[0-9]/.test(value),
    hasSpecialSymbol: /[^A-Za-z0-9]/.test(value),
  };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tokenFromUrl = searchParams.get('token') || '';
  const passwordChecks = getPasswordPolicyChecks(password);
  const passwordRequirements = [
    { label: 'At least 8 characters', met: passwordChecks.hasMinLength },
    { label: 'One uppercase letter', met: passwordChecks.hasUppercase },
    { label: 'One number', met: passwordChecks.hasNumber },
    { label: 'One special symbol', met: passwordChecks.hasSpecialSymbol },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!tokenFromUrl) {
      setError('Missing reset token. Please open the link from your email again.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const policyChecksPassed = Object.values(passwordChecks).every(Boolean);
    if (!policyChecksPassed) {
      setError('Your new password does not meet the password policy.');
      return;
    }

    setLoading(true);

    try {
      const message = await completePasswordReset(tokenFromUrl, password);
      setSuccessMessage(message);
      setPassword('');
      setConfirmPassword('');
    } catch (apiError: unknown) {
      const details = getApiErrorDetails(apiError);
      if (details.length > 0) {
        setError(details.join(' | '));
      } else if (!hasApiResponse(apiError)) {
        setError('Unable to reach the server. Make sure the backend API is running on port 5001.');
      } else {
        const message = getApiErrorMessage(apiError, '');
        setError(message || 'Unable to reset your password right now.');
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

      <div className="relative w-full max-w-[440px]">
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
            <KeyRound className="w-6 h-6 text-[#FFC904]" />
          </div>

          <h2 className="text-[#FAFAFA] mb-1.5" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Choose a new password
          </h2>
          <p className="text-[#8A8A9A] text-sm mb-7 leading-relaxed">
            Create a new password for your Garage Jam account.
          </p>

          {!tokenFromUrl && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-xl px-4 py-3 mb-5 text-sm">
              This reset link is missing a token. Please request a new password reset email.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {successMessage ? (
            <>
              <div className="flex items-start gap-2.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-xl px-4 py-3 mb-5 text-sm">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{successMessage}</p>
                  <p className="text-[#8ED6A2] mt-1">You can sign in right away with your new password.</p>
                </div>
              </div>

              <Link
                to="/login"
                className="block w-full text-center bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] py-3 rounded-xl font-bold transition-all text-sm"
              >
                Go to sign in
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#FAFAFA] text-xs font-semibold mb-2 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] placeholder:text-[#8A8A9A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A9A] hover:text-[#FAFAFA]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <ul className="mt-2 space-y-1">
                  {passwordRequirements.map(requirement => (
                    <li key={requirement.label} className="flex items-center gap-1.5 text-[11px]">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                          requirement.met
                            ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]'
                            : 'bg-transparent border-white/20 text-[#8A8A9A]'
                        }`}
                      >
                        {requirement.met ? <Check className="w-2.5 h-2.5" /> : <span className="w-1 h-1 rounded-full bg-current" />}
                      </span>
                      <span className={requirement.met ? 'text-[#22C55E]' : 'text-[#8A8A9A]'}>{requirement.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-[#FAFAFA] text-xs font-semibold mb-2 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] placeholder:text-[#8A8A9A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A9A] hover:text-[#FAFAFA]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !tokenFromUrl}
                className="w-full bg-[#FFC904] hover:bg-[#FFD84D] disabled:opacity-60 disabled:cursor-not-allowed text-[#09090B] py-3 rounded-xl font-bold transition-all text-sm"
              >
                {loading ? 'Updating password...' : 'Reset password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-[#8A8A9A] text-sm">
              Need another link?{' '}
              <Link to="/forgot-password" className="text-[#FFC904] font-semibold hover:underline">Request a new reset email</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
