import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard, Building2, Users, Mail, Calendar,
  Settings, LogOut, Bell, Music2, Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { StarField } from '../ui/StarField';
import { getIncomingInvites } from '../../api/organization';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/garages', icon: Building2, label: 'Garages' },
  { path: '/organization', icon: Users, label: 'Organizations' },
  { path: '/invites', icon: Mail, label: 'Invites', badge: 2 },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout() {
  const { user, logout, accountType, isLoggedIn } = useApp();
  const navigate = useNavigate();
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (accountType !== 'member') {
      setPendingInviteCount(0);
      return;
    }

    void (async () => {
      try {
        const invites = await getIncomingInvites();
        setPendingInviteCount(invites.length);
      } catch {
        setPendingInviteCount(0);
      }
    })();
  }, [accountType, isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNotificationClick = () => {
    if (accountType === 'member') {
      navigate('/invites');
      return;
    }
    toast.info('No notifications yet. You can manage notification preferences in Settings.');
  };

  return (
    <div className="flex h-screen bg-[#09090B] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-white/[0.06] relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0D0D10 0%, #09090B 100%)' }}>
        {/* Sidebar nebula glow */}
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255,201,4,0.04) 0%, transparent 70%)' }} />
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,201,4,0.03) 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06] relative">
          <button onClick={() => navigate('/dashboard')} type="button" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[#FFC904] flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(255,201,4,0.35)]">
              <Music2 className="w-4 h-4 text-[#09090B]" strokeWidth={2.5} />
            </div>
            <div>
              <span
                className="text-[#FAFAFA] font-black tracking-wider uppercase"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', letterSpacing: '0.05em' }}
              >
                Garage Jam
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#FFC904] font-semibold tracking-wider uppercase">UCF</span>
              </div>
            </div>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 relative">
          {navItems.map(item => {
            const Icon = item.icon;
            const isMemberOnly = ['Garages', 'Organizations', 'Invites'].includes(item.label);
            if (isMemberOnly && accountType === 'fan') return null;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                    isActive
                      ? 'bg-[#FFC904]/10 text-[#FFC904]'
                      : 'text-[#8A8A9A] hover:bg-white/[0.04] hover:text-[#FAFAFA]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#FFC904] rounded-full" />}
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span style={{ fontSize: '13px' }} className="font-medium flex-1">{item.label}</span>
                    {item.badge && item.label === 'Invites' && (
                      <span className="bg-[#FFC904] text-[#09090B] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingInviteCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4 border-t border-white/[0.06] pt-3 relative">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-all group">
            <div className="w-7 h-7 rounded-full bg-[#FFC904] flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(255,201,4,0.3)]">
              <span className="text-[#09090B] font-bold" style={{ fontSize: '10px' }}>{user?.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#FAFAFA] font-medium truncate" style={{ fontSize: '12px' }}>{user?.name}</p>
              <p className="text-[#8A8A9A] truncate" style={{ fontSize: '10px' }}>{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[#8A8A9A] hover:text-[#EF4444]"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle starfield in main content */}
        <StarField count={60} />

        {/* Header */}
        <header className="h-14 border-b border-white/[0.06] flex items-center px-6 gap-4 bg-[#09090B]/80 backdrop-blur-sm flex-shrink-0 relative z-10">
          <div className="flex items-center gap-2 ml-auto">
            {accountType === 'member' && (
              <button
                onClick={() => navigate('/events/create')}
                className="flex items-center gap-2 bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] px-3 py-1.5 rounded-lg transition-all font-semibold shadow-[0_0_16px_rgba(255,201,4,0.2)]"
                style={{ fontSize: '12px' }}
              >
                <Zap className="w-3 h-3" />
                New Event
              </button>
            )}
            <button
              onClick={handleNotificationClick}
              className="relative w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-[#8A8A9A] hover:text-[#FAFAFA] transition-all"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {accountType === 'member' && pendingInviteCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#FFC904] rounded-full shadow-[0_0_4px_rgba(255,201,4,0.6)]"></span>
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}