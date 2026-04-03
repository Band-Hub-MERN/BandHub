import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { buildPath } from '../components/Path';
import { storeToken } from '../tokenStorage';
import { hasSession, storeUser } from '../utils/session';
import type { AccountType, SessionUser } from '../utils/session';

type Mode = 'login' | 'register';

function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [message, setMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('fan');
  const [memberRoleLabel, setMemberRoleLabel] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (hasSession()) {
      navigate('/home');
    }
  }, [navigate]);

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage('');

    try {
      const response = await axios.post(buildPath('api/auth/login'), {
        email,
        password
      });

      const accessToken: string = response.data.accessToken;
      const user: SessionUser = response.data.user;

      storeToken(accessToken);
      storeUser(user);
      navigate('/home');
    } catch (error) {
      setMessage('Login failed. Please check your credentials.');
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Password and confirm password must match.');
      return;
    }

    if (!displayName.trim()) {
      setMessage('Display name is required.');
      return;
    }

    try {
      const response = await axios.post(buildPath('api/auth/register'), {
        email,
        password,
        displayName,
        accountType,
        memberRoleLabel
      });

      const accessToken: string = response.data.accessToken;
      const user: SessionUser = response.data.user;

      storeToken(accessToken);
      storeUser(user);
      navigate('/home');
    } catch (error: any) {
      const details: string[] | undefined = error?.response?.data?.details;
      if (Array.isArray(details) && details.length > 0) {
        setMessage(details.join(' | '));
        return;
      }
      const apiError: string | undefined = error?.response?.data?.error;
      setMessage(apiError || 'Registration failed.');
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1 className="brand-title">Band Hub</h1>
        <p className="brand-subtitle">UCF Garage Practice + Event Planning</p>
      </header>

      <main className="auth-card">
        <div className="auth-tabs">
          <button
            className={mode === 'login' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === 'register' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            <button className="primary-btn" type="submit">Sign In</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <label>
              Account Type
              <select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}>
                <option value="fan">Fan</option>
                <option value="member">Member</option>
              </select>
            </label>

            <label>
              Display Name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </label>

            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            {accountType === 'member' && (
              <label>
                Member Role Label (free-text)
                <input
                  value={memberRoleLabel}
                  onChange={(e) => setMemberRoleLabel(e.target.value)}
                  placeholder="e.g. guitarist, organizer, choreographer"
                />
              </label>
            )}

            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            <button className="primary-btn" type="submit">Create Account</button>
          </form>
        )}

        {message && <p className="form-message">{message}</p>}
      </main>
    </div>
  );
}

export default LoginPage;