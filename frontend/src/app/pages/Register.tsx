import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Music2, Users, Star, Eye, EyeOff, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { StarField } from '../components/ui/StarField';
import { registerRequest } from '../api/auth';
import { getApiErrorDetails, getApiErrorMessage, hasApiResponse } from '../api/error-handling';

export default function Register() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<'member' | 'fan'>('member');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [memberRoleLabel, setMemberRoleLabel] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) return setError('Please fill in all fields.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!agreed) return setError('Please agree to the terms to continue.');

    setLoading(true);

    try {
      const registrationResponse = await registerRequest({
        email,
        password,
        displayName: name,
        accountType,
        memberRoleLabel: accountType === 'member' ? memberRoleLabel : '',
      });

      navigate(`/verify-email?email=${encodeURIComponent(email)}${registrationResponse.registrationStatusToken ? `&registrationToken=${encodeURIComponent(registrationResponse.registrationStatusToken)}` : ''}`);
    } catch (error: unknown) {
      const details = getApiErrorDetails(error);
      if (details.length > 0) {
        setError(details.join(' | '));
      } else if (!hasApiResponse(error)) {
        setError('Registration is unavailable right now. Make sure the backend API is running on port 5001.');
      } else {
        const apiError = getApiErrorMessage(error, '');
        setError(apiError || 'Unable to create account right now.');
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
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[#8A8A9A] hover:text-[#FAFAFA] mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </button>

        <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-8" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}>
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#FFC904] flex items-center justify-center">
              <Music2 className="w-4 h-4 text-[#09090B]" strokeWidth={2.5} />
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

          <h2 className="text-[#FAFAFA] mb-1.5" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Create your account</h2>
          <p className="text-[#8A8A9A] text-sm mb-7">Join the UCF Garage Jam community</p>

          {/* Account type selector */}
          <div className="mb-6">
            <label className="block text-[#FAFAFA] text-xs font-semibold mb-3 uppercase tracking-wider">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  type: 'member' as const,
                  icon: Users,
                  label: 'Member',
                  desc: 'Organize & book spaces',
                  perks: ['Create organizations', 'Book garages', 'Manage events'],
                  color: '#FFC904',
                },
                {
                  type: 'fan' as const,
                  icon: Star,
                  label: 'Fan',
                  desc: 'Discover & attend events',
                  perks: ['Browse events', 'Track orgs', 'Free to join'],
                  color: '#A855F7',
                },
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = accountType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setAccountType(opt.type)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-[#FFC904] bg-[#FFC904]/[0.06]'
                        : 'border-white/[0.08] bg-[#1C1C1F] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: isSelected ? `${opt.color}20` : 'rgba(255,255,255,0.05)' }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: isSelected ? opt.color : '#8A8A9A' }} />
                      </div>
                      {isSelected && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-[#FFC904] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-[#09090B]" />
                        </div>
                      )}
                    </div>
                    <p className={`font-bold text-sm mb-0.5 ${isSelected ? 'text-[#FAFAFA]' : 'text-[#8A8A9A]'}`}>{opt.label}</p>
                    <p className="text-[#8A8A9A] text-xs">{opt.desc}</p>
                    <ul className="mt-2 space-y-0.5">
                      {opt.perks.map(perk => (
                        <li key={perk} className="flex items-center gap-1.5 text-[10px] text-[#8A8A9A]">
                          <Check className="w-2.5 h-2.5 text-[#22C55E] flex-shrink-0" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[#FAFAFA] text-xs font-semibold mb-2 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] placeholder:text-[#8A8A9A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40 transition-colors"
              />
            </div>

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
              <label className="block text-[#FAFAFA] text-xs font-semibold mb-2 uppercase tracking-wider">Password</label>
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
              {password && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4].map(i => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: password.length >= i * 2 ? (password.length >= 8 ? '#22C55E' : '#FFC904') : '#2A2A2F' }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[#FAFAFA] text-xs font-semibold mb-2 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
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

            {accountType === 'member' && (
              <div>
                <label className="block text-[#FAFAFA] text-xs font-semibold mb-2 uppercase tracking-wider">Role Label (Optional)</label>
                <input
                  type="text"
                  value={memberRoleLabel}
                  onChange={e => setMemberRoleLabel(e.target.value)}
                  placeholder="e.g. guitarist, organizer"
                  className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] placeholder:text-[#8A8A9A] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40 transition-colors"
                />
              </div>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#1C1C1F] accent-[#FFC904] flex-shrink-0"
              />
              <span className="text-[#8A8A9A] text-sm leading-relaxed">
                I agree to the{' '}
                <span className="text-[#FFC904] cursor-pointer hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="text-[#FFC904] cursor-pointer hover:underline">Privacy Policy</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFC904] hover:bg-[#FFD84D] disabled:opacity-60 text-[#09090B] py-3 rounded-xl font-bold transition-all text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#09090B]/30 border-t-[#09090B] rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : `Create ${accountType === 'member' ? 'Member' : 'Fan'} Account`}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#8A8A9A] text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#FFC904] font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}