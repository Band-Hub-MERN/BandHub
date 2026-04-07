import { useNavigate } from 'react-router';
import { Music2, Building2, Users, Calendar, ChevronRight, Zap, Globe } from 'lucide-react';
import { StarField } from '../components/ui/StarField';

const features = [
  {
    icon: Building2,
    title: 'CLAIM YOUR SPACE',
    description: 'Book garage floors for late-night practice. Slots from 6 PM to midnight, with real-time availability across Garages A–I.',
    color: '#FFC904',
    bg: 'rgba(255,201,4,0.08)',
  },
  {
    icon: Users,
    title: 'BUILD YOUR CREW',
    description: 'Create your organization, invite members by email, assign roles, and manage permissions — all in one clean dashboard.',
    color: '#FFC904',
    bg: 'rgba(255,201,4,0.06)',
  },
  {
    icon: Globe,
    title: 'GO LIVE TO CAMPUS',
    description: 'Post public events for fans, control what\'s visible, and let the UCF community discover your next big performance.',
    color: '#FFC904',
    bg: 'rgba(255,201,4,0.08)',
  },
];

const stats = [
  { value: '6', label: 'Practice Garages' },
  { value: '4', label: 'Floors Each' },
  { value: '6h', label: 'Daily Windows' },
  { value: '∞', label: 'Possibilities' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#09090B]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFC904] flex items-center justify-center">
              <Music2 className="w-4 h-4 text-[#09090B]" strokeWidth={2.5} />
            </div>
            <div>
              <span
                className="font-black text-[#FAFAFA] tracking-tight uppercase"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.15rem', letterSpacing: '0.02em' }}
              >
                Garage Jam
              </span>
              <span className="ml-2 text-[10px] text-[#FFC904] font-bold tracking-widest uppercase border border-[#FFC904]/30 px-1.5 py-0.5 rounded">UCF</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/events')}
              className="text-[#8A8A9A] hover:text-[#FAFAFA] transition-colors px-3 py-2 rounded-lg text-sm tracking-wide"
            >
              Events
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-[#8A8A9A] hover:text-[#FAFAFA] transition-colors px-3 py-2 rounded-lg text-sm tracking-wide"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] px-4 py-2 rounded-lg text-sm font-black transition-all uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Gold accent bar (UCF style) */}
      <div className="fixed top-16 left-0 right-0 z-40 h-1 bg-[#FFC904]" />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <StarField count={200} />

        {/* Additional glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[#FFC904]/[0.03] blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#FFC904]/10 border border-[#FFC904]/25 text-[#FFC904] px-4 py-2 rounded-full text-xs font-bold mb-10 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC904] animate-pulse" />
            UCF Student Organizations Platform
          </div>

          {/* Headline — UCF condensed bold style */}
          <h1
            className="text-[#FAFAFA] mb-6 max-w-5xl mx-auto uppercase"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(3.5rem, 10vw, 8rem)',
              fontWeight: 900,
              letterSpacing: '0.01em',
              lineHeight: 0.95,
            }}
          >
            Your Crew.{' '}
            <span className="text-[#FFC904]">Your Stage.</span>
            <br />Your Campus.
          </h1>

          {/* Gold underline accent */}
          <div className="w-24 h-1 bg-[#FFC904] mx-auto mb-8" />

          <p className="text-[#A0A0B0] max-w-2xl mx-auto mb-10 leading-relaxed" style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)' }}>
            Garage Jam helps UCF student organizations claim garage practice spaces, coordinate late-night sessions, and post public events — all in one premium platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
            <button
              onClick={() => navigate('/register')}
              className="group flex items-center gap-2 bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] px-8 py-4 rounded-xl font-black transition-all shadow-[0_0_40px_rgba(255,201,4,0.25)] hover:shadow-[0_0_60px_rgba(255,201,4,0.4)] uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem' }}
            >
              <Users className="w-4 h-4" />
              Create Organization
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate('/events')}
              className="group flex items-center gap-2 border border-white/[0.15] hover:border-[#FFC904]/40 text-[#FAFAFA] hover:text-[#FFC904] px-8 py-4 rounded-xl font-semibold transition-all hover:bg-[#FFC904]/[0.04] uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem' }}
            >
              <Calendar className="w-4 h-4" />
              View Events
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-12 flex-wrap">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-[#FFC904] font-black mb-1 uppercase"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '3rem', letterSpacing: '-0.01em', lineHeight: 1 }}
                >
                  {s.value}
                </div>
                <div className="text-[#8A8A9A] text-xs font-medium uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gold divider bar (UCF style) */}
      <div className="bg-[#FFC904] py-3">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          {['PRACTICE GARAGES', 'BOOK SPACES', 'MANAGE EVENTS', 'BUILD YOUR ORG'].map(label => (
            <span
              key={label}
              className="text-[#09090B] font-black text-sm uppercase tracking-widest cursor-pointer hover:opacity-75 transition-opacity"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Features — space section */}
      <section className="relative py-28 overflow-hidden" style={{ background: '#07071A' }}>
        <StarField count={120} />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="mb-4">
            <span className="text-[#FFC904] text-xs font-bold uppercase tracking-widest">Everything You Need</span>
          </div>
          <div className="w-16 h-1 bg-[#FFC904] mb-8" />
          <h2
            className="text-[#FAFAFA] mb-5 uppercase max-w-3xl"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 900,
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            Everything your org needs to{' '}
            <span className="text-[#FFC904]">perform</span>
          </h2>
          <p className="text-[#8A8A9A] max-w-xl mb-16 leading-relaxed">
            From booking a floor to selling out your showcase — Garage Jam covers the full journey for UCF student organizations.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group p-7 rounded-2xl border border-white/[0.06] hover:border-[#FFC904]/30 transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: f.bg, border: '1px solid rgba(255,201,4,0.15)' }}>
                    <Icon className="w-6 h-6" style={{ color: f.color }} />
                  </div>
                  <h3
                    className="text-[#FAFAFA] mb-3 uppercase"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.05em' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-[#8A8A9A] leading-relaxed text-sm">{f.description}</p>
                </div>
              );
            })}
          </div>

          {/* How it works */}
          <div
            className="rounded-2xl border border-white/[0.06] p-8 md:p-12"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <h3
              className="text-center text-[#FAFAFA] mb-2 uppercase"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, letterSpacing: '0.05em' }}
            >
              How it works
            </h3>
            <div className="w-12 h-0.5 bg-[#FFC904] mx-auto mb-10" />
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'REGISTER', desc: 'Sign up as a Member or Fan with your email.' },
                { step: '02', title: 'CREATE ORG', desc: 'Set up your band, dance crew, or student group profile.' },
                { step: '03', title: 'BOOK SPACE', desc: 'Reserve garage floors for 6 PM–midnight practice sessions.' },
                { step: '04', title: 'PERFORM', desc: 'Post public events and let fans discover your shows.' },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div
                    className="text-[#FFC904] font-black mb-3"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '3.5rem', letterSpacing: '-0.01em', opacity: 0.25, lineHeight: 1 }}
                  >
                    {step.step}
                  </div>
                  <h4
                    className="text-[#FAFAFA] font-black mb-2 uppercase tracking-wider"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem' }}
                  >
                    {step.title}
                  </h4>
                  <p className="text-[#8A8A9A] text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-28 overflow-hidden">
        <StarField count={80} />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl border border-[#FFC904]/20 p-14 overflow-hidden" style={{ background: 'rgba(255,201,4,0.04)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFC904]/[0.07] to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-px bg-[#FFC904]/40" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#FFC904] flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(255,201,4,0.4)]">
                <Zap className="w-8 h-8 text-[#09090B]" strokeWidth={2.5} />
              </div>
              <h2
                className="text-[#FAFAFA] mb-4 uppercase"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '0.03em', lineHeight: 1 }}
              >
                Ready to make noise?
              </h2>
              <div className="w-16 h-1 bg-[#FFC904] mx-auto mb-6" />
              <p className="text-[#8A8A9A] mb-10 max-w-md mx-auto leading-relaxed">
                Join hundreds of UCF student organizations already using Garage Jam to coordinate, create, and perform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] px-10 py-4 rounded-xl font-black transition-all shadow-[0_0_30px_rgba(255,201,4,0.3)] hover:shadow-[0_0_45px_rgba(255,201,4,0.45)] uppercase tracking-widest"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem' }}
                >
                  Start for Free
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#8A8A9A] hover:text-[#FFC904] transition-colors px-4 py-2 text-sm"
                >
                  Already have an account? Log in →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-10" style={{ background: '#060609' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFC904] flex items-center justify-center">
              <Music2 className="w-3.5 h-3.5 text-[#09090B]" />
            </div>
            <span
              className="text-[#FAFAFA] font-black uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem' }}
            >
              Garage Jam
            </span>
            <span className="text-[#4A4A5A] text-sm">· UCF Student Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-1 h-1 rounded-full bg-[#FFC904]" />
            <p className="text-[#4A4A5A] text-xs">© 2026 Garage Jam. Built for UCF Knights.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}