import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';

interface HomeSessionUser {
  id: string;
  email: string;
  accountType: 'fan' | 'member';
  displayName: string;
  organizationId: string | null;
  memberRoleLabel: string;
}

interface InviteRecord {
  id: string;
  invitedEmail: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface EventItem {
  garage: string;
  title: string;
  dateTime: string;
  vibe: string;
  crowd: string;
}

interface DashboardStat {
  label: string;
  value: string;
  detail: string;
}

function retrieveToken(): string | null {
  return localStorage.getItem('token');
}

function storeToken(token: string): void {
  localStorage.setItem('token', token);
}

function buildPath(path: string): string {
  return `/${path.replace(/^\/+/, '')}`;
}

function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('session-user');
}

function getStoredUser(): HomeSessionUser | null {
  try {
    const raw = localStorage.getItem('session-user');
    return raw ? (JSON.parse(raw) as HomeSessionUser) : null;
  } catch {
    return null;
  }
}

function hasSession(): boolean {
  return Boolean(retrieveToken());
}

function storeUser(user: HomeSessionUser): void {
  localStorage.setItem('session-user', JSON.stringify(user));
}

const fanEventPreview: EventItem[] = [
  { garage: 'A', title: 'Sunset Strings Session', dateTime: 'Fri 8:00 PM', vibe: 'Acoustic warm-up', crowd: 'Medium crowd' },
  { garage: 'B', title: 'Knight Rhythms Pop-Up', dateTime: 'Sat 9:30 PM', vibe: 'High-energy pop', crowd: 'Busy tonight' },
  { garage: 'C', title: 'UCF Groove Collective', dateTime: 'Sun 7:30 PM', vibe: 'Funk and fusion', crowd: 'Open slots' },
  { garage: 'H', title: 'Midnight Acoustic Circle', dateTime: 'Mon 10:00 PM', vibe: 'Late-night jam', crowd: 'Chill turnout' }
];

function toTitleCase(value: string): string {
  if (!value) {
    return '';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<HomeSessionUser | null>(null);
  const [message, setMessage] = useState('');
  const [showOrgPrompt, setShowOrgPrompt] = useState(true);

  const [orgName, setOrgName] = useState('');
  const [orgCategory, setOrgCategory] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [invites, setInvites] = useState<InviteRecord[]>([]);

  useEffect(() => {
    if (!hasSession()) {
      navigate('/');
      return;
    }

    const existingUser = getStoredUser();
    if (existingUser) {
      setUser(existingUser);
      setShowOrgPrompt(existingUser.accountType === 'member' && !existingUser.organizationId);
    }

    void refreshSession();
  }, [navigate]);

  async function refreshSession(): Promise<void> {
    const token = retrieveToken();
    if (!token) {
      return;
    }

    try {
      const response = await axios.get(buildPath('api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      const refreshedToken: string = response.data.accessToken;
      const refreshedUser: HomeSessionUser = response.data.user;
      storeToken(refreshedToken);
      storeUser(refreshedUser);
      setUser(refreshedUser);
      setShowOrgPrompt(refreshedUser.accountType === 'member' && !refreshedUser.organizationId);

      if (refreshedUser.accountType === 'member' && refreshedUser.organizationId) {
        await loadInvites();
      }
    } catch {
      clearSession();
      navigate('/');
    }
  }

  async function loadInvites(): Promise<void> {
    const token = retrieveToken();
    if (!token) {
      return;
    }

    try {
      const response = await axios.get(buildPath('api/org/invites'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const inviteRows = response.data.invites as InviteRecord[];
      setInvites(inviteRows);
    } catch {
      setInvites([]);
    }
  }

  async function handleCreateOrg(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage('');

    const token = retrieveToken();
    if (!token) {
      setMessage('Session expired. Please login again.');
      return;
    }

    try {
      const response = await axios.post(
        buildPath('api/org/create'),
        { name: orgName, category: orgCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const refreshedToken: string = response.data.accessToken;
      storeToken(refreshedToken);
      await refreshSession();
      setOrgName('');
      setOrgCategory('');
      setShowOrgPrompt(false);
      setMessage('Organization created successfully.');
    } catch (error: any) {
      const apiError: string | undefined = error?.response?.data?.error;
      setMessage(apiError || 'Unable to create organization.');
    }
  }

  async function handleSendInvite(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage('');

    const token = retrieveToken();
    if (!token) {
      setMessage('Session expired. Please login again.');
      return;
    }

    try {
      await axios.post(
        buildPath('api/org/invites'),
        { invitedEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInvitedEmail('');
      setMessage('Invite sent. It expires in 7 days.');
      await loadInvites();
    } catch (error: any) {
      const apiError: string | undefined = error?.response?.data?.error;
      setMessage(apiError || 'Unable to send invite.');
    }
  }

  function handleLogout(): void {
    clearSession();
    navigate('/');
  }

  function formatFriendlyDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  if (!user) {
    return <div className="page-shell"><p>Loading session...</p></div>;
  }

  const isMember = user.accountType === 'member';
  const hasOrganization = Boolean(user.organizationId);
  const pendingInvites = invites.filter((invite) => invite.status === 'pending').length;
  const dashboardStats: DashboardStat[] = isMember
    ? [
      {
        label: 'Workspace',
        value: hasOrganization ? 'Organization active' : 'Solo member',
        detail: hasOrganization ? 'Invite flow is unlocked' : 'Create your first group'
      },
      {
        label: 'Pending invites',
        value: String(pendingInvites),
        detail: hasOrganization ? 'Waiting on responses' : 'Available after setup'
      },
      {
        label: 'Role',
        value: user.memberRoleLabel || 'Member',
        detail: hasOrganization ? 'Shown on your team profile' : 'Add this after signup'
      }
    ]
    : [
      {
        label: 'Upcoming sets',
        value: String(fanEventPreview.length),
        detail: 'Fresh campus sessions this week'
      },
      {
        label: 'Latest hotspot',
        value: 'Garage B',
        detail: 'Most active rehearsal zone'
      },
      {
        label: 'Your mode',
        value: 'Fan pass',
        detail: 'Browse events without org setup'
      }
    ];

  const navigationItems = [
    { label: 'Home', active: true },
    { label: 'Garages', active: false },
    { label: 'Organizations', active: false },
    { label: 'Invites', active: false },
    { label: 'Events', active: false },
    { label: 'Settings', active: false }
  ];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon">GJ</div>
          <div>
            <p className="dashboard-brand-title">Garage Jam</p>
            <p className="dashboard-brand-subtitle">UCF</p>
          </div>
        </div>

        <div className="dashboard-account-pill">
          <span className={`role-pill role-pill--${user.accountType}`}>
            {isMember ? 'Member' : 'Fan'}
          </span>
        </div>

        <nav className="dashboard-nav">
          {navigationItems
            .filter((item) => isMember || (item.label !== 'Garages' && item.label !== 'Organizations' && item.label !== 'Invites'))
            .map((item) => (
              <button key={item.label} type="button" className={item.active ? 'dashboard-nav-item active' : 'dashboard-nav-item'}>
                {item.label}
              </button>
            ))}
        </nav>

        <div className="dashboard-user">
          <p className="dashboard-user-name">{user.displayName}</p>
          <p className="dashboard-user-email">{user.email}</p>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <input className="dashboard-search" placeholder="Search garages, events, invites..." />
          <button className="secondary-btn" onClick={handleLogout} type="button">
            Logout
          </button>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <p className="dashboard-date">{formatFriendlyDate(new Date())}</p>
            <h1 className="dashboard-title">Welcome back, {user.displayName}.</h1>
            <p className="dashboard-lead">
              {isMember
                ? (hasOrganization
                  ? 'Your organization is active. Review invite activity and continue growing your member roster.'
                  : 'Finish organization setup to unlock invite workflows and collaboration tools.')
                : 'Browse upcoming campus sessions and plan where you want to go next.'}
            </p>
          </section>

          {message && <div className="flash-banner">{message}</div>}

          <section className="dashboard-stats">
            {dashboardStats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <p className="stat-label">{stat.label}</p>
                <h2 className="stat-value">{stat.value}</h2>
                <p className="stat-detail">{stat.detail}</p>
              </article>
            ))}
          </section>

          {!isMember ? (
            <section className="content-card content-card--feature">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Tonight Around Campus</p>
                  <h2>Upcoming Garage Sessions</h2>
                </div>
                <p className="section-note">Sorted by garage and start time for quick planning.</p>
              </div>

              <div className="event-grid">
                {fanEventPreview.map((eventItem) => (
                  <article key={`${eventItem.garage}-${eventItem.title}-${eventItem.dateTime}`} className="event-card">
                    <div className="event-card-top">
                      <span className="event-badge">Garage {eventItem.garage}</span>
                      <span className="event-time">{eventItem.dateTime}</span>
                    </div>
                    <h3>{eventItem.title}</h3>
                    <p className="event-vibe">{eventItem.vibe}</p>
                    <div className="event-meta">
                      <span>{eventItem.crowd}</span>
                      <span>Open campus jam</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <div className="content-grid">
              {showOrgPrompt && !hasOrganization && (
                <section className="content-card content-card--feature">
                  <div className="section-heading">
                    <div>
                      <p className="section-kicker">Member Setup</p>
                      <h2>Create or Join an Organization</h2>
                    </div>
                    <p className="section-note">Set up your crew space now, or close this and come back later.</p>
                  </div>

                  <div className="split-layout">
                    <div className="journey-list">
                      <div className="journey-item">
                        <span className="journey-index">01</span>
                        <div>
                          <h3>Name your organization clearly</h3>
                          <p>Use a name people on campus will instantly recognize when they receive invites.</p>
                        </div>
                      </div>
                      <div className="journey-item">
                        <span className="journey-index">02</span>
                        <div>
                          <h3>Choose the group type</h3>
                          <p>Band, dance group, club, frat, or anything else that frames what your team is about.</p>
                        </div>
                      </div>
                    </div>

                    <div className="form-shell">
                      <form className="auth-form" onSubmit={handleCreateOrg}>
                        <label>
                          Organization Name
                          <input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
                        </label>
                        <label>
                          Category / Type
                          <input
                            value={orgCategory}
                            onChange={(e) => setOrgCategory(e.target.value)}
                            placeholder="band, club, frat, dance group"
                            required
                          />
                        </label>
                        <div className="button-row">
                          <button className="primary-btn" type="submit">Create Organization</button>
                          <button className="secondary-btn" type="button" onClick={() => setShowOrgPrompt(false)}>
                            Close
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </section>
              )}

              {hasOrganization ? (
                <>
                  <section className="content-card content-card--feature">
                    <div className="section-heading">
                      <div>
                        <p className="section-kicker">Team Growth</p>
                        <h2>Send Organization Invites</h2>
                      </div>
                      <p className="section-note">Bring new people in with one email at a time.</p>
                    </div>

                    <div className="form-shell">
                      <form className="auth-form" onSubmit={handleSendInvite}>
                        <label>
                          Invite Member by Email
                          <input
                            type="email"
                            value={invitedEmail}
                            onChange={(e) => setInvitedEmail(e.target.value)}
                            required
                          />
                        </label>
                        <button className="primary-btn" type="submit">Send Invite</button>
                      </form>
                    </div>
                  </section>

                  <section className="content-card">
                    <div className="section-heading">
                      <div>
                        <p className="section-kicker">Invite Activity</p>
                        <h2>Recent Invite Status</h2>
                      </div>
                      <p className="section-note">Latest 100 invites, ordered newest first.</p>
                    </div>

                    {invites.length === 0 ? (
                      <div className="empty-state">
                        <h3>No invites yet</h3>
                        <p>Send your first invite to start building out the organization roster.</p>
                      </div>
                    ) : (
                      <div className="invite-stack">
                        {invites.map((invite) => (
                          <article key={invite.id} className="invite-row">
                            <div>
                              <h3>{invite.invitedEmail}</h3>
                              <p>
                                Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                {' '}
                                | Created {new Date(invite.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`status-tag status-tag--${invite.status}`}>
                              {toTitleCase(invite.status)}
                            </span>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              ) : (
                <section className="content-card">
                  <div className="section-heading">
                    <div>
                      <p className="section-kicker">Status</p>
                      <h2>No Organization Linked Yet</h2>
                    </div>
                  </div>

                  <div className="empty-state">
                    <h3>Your member account is ready</h3>
                    <p>Create or join an organization whenever you are ready to start inviting collaborators.</p>
                    <button className="secondary-btn" type="button" onClick={() => setShowOrgPrompt(true)}>
                      Open Create / Join Flow
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
