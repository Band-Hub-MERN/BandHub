import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { storeToken } from '../tokenStorage';
import { buildPath } from '../utils/api';
import { hasSession, storeUser } from '../utils/session';
import type { AccountType, SessionUser } from '../utils/session';

type Mode = 'login' | 'register';

function LoginPage() {
  const navigate = useNavigate();
  const registerStatusPollRef = useRef<number | null>(null);

  const [mode, setMode] = useState<Mode>('login');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    return () => {
      stopRegistrationStatusPolling();
    };
  }, []);

  function stopRegistrationStatusPolling(): void {
    if (registerStatusPollRef.current !== null) {
      window.clearTimeout(registerStatusPollRef.current);
      registerStatusPollRef.current = null;
    }
  }

  function startRegistrationStatusPolling(registrationStatusToken: string): void {
    stopRegistrationStatusPolling();
    let attempts = 0;

    const poll = async () => {
      attempts += 1;

      try {
        const response = await axios.get(
          buildPath(`api/auth/register-status?token=${encodeURIComponent(registrationStatusToken)}`)
        );

        const status: string = response.data.status || 'pending';
        const statusMessage: string = response.data.message || '';
        const shouldStopPolling: boolean = Boolean(response.data.shouldStopPolling);

        if (status === 'bounced_invalid') {
          setMode('register');
          setMessage(
            statusMessage
            || 'That email address appears not to exist. Please double-check it for typos and try again.'
          );
          stopRegistrationStatusPolling();
          return;
        }

        if (status === 'bounced' || status === 'dropped') {
          setMode('register');
          setMessage(
            statusMessage
            || 'We could not deliver the verification email. Please double-check the address and try again.'
          );
          stopRegistrationStatusPolling();
          return;
        }

        if (shouldStopPolling || attempts >= 10) {
          stopRegistrationStatusPolling();
          return;
        }
      } catch {
        if (attempts >= 10) {
          stopRegistrationStatusPolling();
          return;
        }
      }

      registerStatusPollRef.current = window.setTimeout(poll, 2000);
    };

    registerStatusPollRef.current = window.setTimeout(poll, 2000);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);
    stopRegistrationStatusPolling();

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
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);
    stopRegistrationStatusPolling();

    if (password !== confirmPassword) {
      setMessage('Password and confirm password must match.');
      setIsSubmitting(false);
      return;
    }

    if (!displayName.trim()) {
      setMessage('Display name is required.');
      setIsSubmitting(false);
      return;
    }

    try {
      setMessage('Creating your account and sending your verification email...');
      const response = await axios.post(buildPath('api/auth/register'), {
        email,
        password,
        displayName,
        accountType,
        memberRoleLabel
      });
      const registrationStatusToken: string | undefined = response.data.registrationStatusToken;
      const apiMessage: string | undefined = response.data.message;
      setMessage(
        apiMessage
        || 'Account created. Please check your email to verify your account. If you do not receive it soon, double-check the email address and your spam folder.'
      );
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      if (registrationStatusToken) {
        startRegistrationStatusPolling(registrationStatusToken);
      }
    } catch (error: any) {
      const details: string[] | undefined = error?.response?.data?.details;
      if (Array.isArray(details) && details.length > 0) {
        setMessage(details.join(' | '));
        return;
      }
      const apiError: string | undefined = error?.response?.data?.error;
      setMessage(apiError || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="brand-copy">
          <h1 className="brand-title">Garage Jam</h1>
          <p className="brand-subtitle">UCF Garage Practice + Event Planning</p>
        </div>

        <img className="header-logo" src="/UCF_Knights_logo.svg" alt="UCF logo" />
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

            <button className="primary-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <label>
              Account Type
              <select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}>
                <option value="fan">Fan</option>
                <option value="member">Band</option>
                <option value="music group">Music Group</option>
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

            <button className="primary-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {message && <p className="form-message">{message}</p>}
      </main>
    </div>
  );
}

export default LoginPage;
