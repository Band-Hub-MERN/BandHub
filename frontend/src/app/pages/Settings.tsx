import { useEffect, useState } from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { updateMe } from '../api/auth';
import { getApiErrorMessage } from '../api/error-handling';

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 flex-shrink-0 ${value ? 'bg-[#FFC904]' : 'bg-[#2A2A2F]'}`}
    >
      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

export default function Settings() {
  const { user, logout, login } = useApp();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState({ invites: true, events: true, bookings: true, digest: false });
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  useEffect(() => {
    setName(user?.name ?? '');
    setBio(user?.bio ?? '');
  }, [user?.name, user?.bio]);

  const save = async () => {
    try {
      const updatedUser = await updateMe({
        displayName: name,
        bio,
        notificationPrefs: notifs,
      });
      login(updatedUser.accountType);
      toast.success('Settings saved');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to save settings'));
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="mb-7">
        <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-widest mb-1">Your Account</p>
        <h1
          className="text-[#FAFAFA] uppercase mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.25rem', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1 }}
        >
          Settings
        </h1>
        <div className="w-10 h-0.5 bg-[#FFC904] mt-2 mb-3" />
        <p className="text-[#8A8A9A] text-sm">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-[#FFC904]" />
          <h3 className="text-[#FAFAFA] font-bold">Profile</h3>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-[#FFC904]/15 border border-[#FFC904]/25 flex items-center justify-center text-[#FFC904] font-black text-xl">
            {user?.avatar}
          </div>
          <div>
            <p className="text-[#FAFAFA] font-bold">{user?.name}</p>
            <p className="text-[#8A8A9A] text-sm">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] bg-[#FFC904]/10 text-[#FFC904] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
              {user?.accountType}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40" />
          </div>
          <div>
            <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">Bio</label>
            <input value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40" />
          </div>
          <button onClick={save} className="bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] px-5 py-2.5 rounded-xl font-bold text-sm transition-all">Save Profile</button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[#FFC904]" />
          <h3 className="text-[#FAFAFA] font-bold">Notifications</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'invites' as const, label: 'Organization invites', desc: 'When someone invites you to their org' },
            { key: 'events' as const, label: 'New events', desc: 'When orgs you follow post events' },
            { key: 'bookings' as const, label: 'Booking reminders', desc: '1 hour before your practice session' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-[#FAFAFA] text-sm font-medium">{label}</p>
                <p className="text-[#8A8A9A] text-xs">{desc}</p>
              </div>
              <Toggle value={notifs[key]} onChange={v => setNotifs(p => ({ ...p, [key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="bg-[#111113] border border-[#EF4444]/15 rounded-2xl p-5">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-2.5 text-[#EF4444] hover:text-[#FF6B6B] transition-colors font-semibold text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign out of Garage Jam
        </button>
        <p className="text-[#8A8A9A] text-xs mt-2">You'll need to log in again to access your dashboard.</p>
      </div>
    </div>
  );
}