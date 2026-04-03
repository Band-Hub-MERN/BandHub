import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { buildPath } from '../components/Path';
import { retrieveToken, storeToken } from '../tokenStorage';
import { clearSession, getStoredUser, hasSession, storeUser } from '../utils/session';

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
}

const fanEventPreview: EventItem[] = [
  { garage: 'A', title: 'Sunset Strings Session', dateTime: 'Fri 8:00 PM' },
  { garage: 'B', title: 'Knight Rhythms Pop-Up', dateTime: 'Sat 9:30 PM' },
  { garage: 'C', title: 'UCF Groove Collective', dateTime: 'Sun 7:30 PM' },
  { garage: 'H', title: 'Midnight Acoustic Circle', dateTime: 'Mon 10:00 PM' }
];

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

  async function handleCreateOrg(event: any): Promise<void> {
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

  async function handleSendInvite(event: any): Promise<void> {
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

  if (!user) {
    return <div className="page-shell"><p>Loading session...</p></div>;
  }

  return (
    <div className="page-shell">
      <header className="home-header">
        <div>
          <h1 className="brand-title">Band Hub</h1>
          <p className="brand-subtitle">
            Welcome, {user.displayName} ({user.accountType})
          </p>
        </div>
        <button className="secondary-btn" onClick={handleLogout} type="button">Logout</button>
      </header>

      {message && <p className="form-message">{message}</p>}

      {user.accountType === 'fan' ? (
        <section className="panel">
          <h2>Upcoming Campus Events</h2>
          <p className="panel-note">Sorted by garage, then date/time.</p>
          <ul className="event-list">
            {fanEventPreview.map((eventItem) => (
              <li key={`${eventItem.garage}-${eventItem.title}-${eventItem.dateTime}`}>
                <strong>Garage {eventItem.garage}</strong> — {eventItem.title} — {eventItem.dateTime}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          {showOrgPrompt && !user.organizationId && (
            <section className="panel">
              <h2>Create or Join an Organization</h2>
              <p className="panel-note">
                You can close this and continue browsing. You can always create/join later.
              </p>

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
            </section>
          )}

          {user.organizationId ? (
            <section className="panel">
              <h2>Organization Invites</h2>
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

              <ul className="event-list">
                {invites.length === 0 ? (
                  <li>No invites yet.</li>
                ) : (
                  invites.map((invite) => (
                    <li key={invite.id}>
                      {invite.invitedEmail} — {invite.status} — expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </li>
                  ))
                )}
              </ul>
            </section>
          ) : (
            <section className="panel">
              <h2>No Organization Linked</h2>
              <p className="panel-note">Create or join an organization when ready.</p>
              <button className="secondary-btn" type="button" onClick={() => setShowOrgPrompt(true)}>
                Open Create/Join Prompt
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default HomePage;
