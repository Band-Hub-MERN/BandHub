import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { storeToken } from '../tokenStorage';
import { buildPath } from '../utils/api';
import { hasSession, storeUser } from '../utils/session';
import type { AccountType, SessionUser } from '../utils/session';

type Mode = 'login' | 'register';

const REGISTRATION_STATUS_INITIAL_DELAY_MS = 6000;
const REGISTRATION_STATUS_POLL_INTERVAL_MS = 2000;
const REGISTRATION_STATUS_POLL_TIMEOUT_MS = 30 * 1000;
const REGISTERING_MESSAGE_MIN_DURATION_MS = 1500;
const REGISTRATION_STATUS_PENDING_MESSAGE =
  'We sent the verification email. If it does not arrive shortly, check your spam or junk folder, then double-check the address and try again.';

function LoginPage() {
  const navigate = useNavigate();
  const registerStatusPollRef = useRef<number | null>(null);

  const [mode, setMode] = useState<Mode>('login');
  const [loginMessage, setLoginMessage] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
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

  function clearMessages(): void {
    setLoginMessage('');
    setRegisterMessage('');
  }

  function showLoginMessage(nextMessage: string): void {
    setRegisterMessage('');
    setLoginMessage(nextMessage);
  }

  function showRegisterMessage(nextMessage: string): void {
    setLoginMessage('');
    setRegisterMessage(nextMessage);
  }

  function handleModeChange(nextMode: Mode): void {
    stopRegistrationStatusPolling();
    clearMessages();
    setMode(nextMode);
  }

  function startRegistrationStatusPolling(registrationStatusToken: string, startedAt = Date.now()): void {
    stopRegistrationStatusPolling();
    showLoginMessage(REGISTRATION_STATUS_PENDING_MESSAGE);

    const poll = async () => {
      const pollExpired = Date.now() - startedAt >= REGISTRATION_STATUS_POLL_TIMEOUT_MS;
      if (pollExpired) {
        stopRegistrationStatusPolling();
        return;
      }

      try {
        const response = await axios.get(
          buildPath(`api/auth/register-status?token=${encodeURIComponent(registrationStatusToken)}`)
        );

        const status: string = response.data.status || 'pending';
        const statusMessage: string = response.data.message || '';
        const shouldStopPolling: boolean = Boolean(response.data.shouldStopPolling);

        if (status === 'bounced_invalid') {
          setMode('register');
          showRegisterMessage(
            statusMessage
            || 'That email address appears not to exist. Please double-check it for typos and try again.'
          );
          stopRegistrationStatusPolling();
          return;
        }

        if (status === 'bounced' || status === 'dropped' || status === 'blocked' || status === 'send_failed') {
          setMode('register');
          showRegisterMessage(
            statusMessage
            || 'We could not deliver the verification email. Please double-check the address and try again.'
          );
          stopRegistrationStatusPolling();
          return;
        }

        if (status === 'pending' || status === 'processed' || status === 'deferred') {
          showLoginMessage(REGISTRATION_STATUS_PENDING_MESSAGE);
        }

        if (shouldStopPolling) {
          stopRegistrationStatusPolling();
          return;
        }
      } catch {
        if (pollExpired) {
          stopRegistrationStatusPolling();
          return;
        }
      }

      registerStatusPollRef.current = window.setTimeout(poll, REGISTRATION_STATUS_POLL_INTERVAL_MS);
    };

    registerStatusPollRef.current = window.setTimeout(poll, REGISTRATION_STATUS_INITIAL_DELAY_MS);
  }

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoginMessage('');
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
      setLoginMessage('Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setRegisterMessage('');
    setIsSubmitting(true);
    stopRegistrationStatusPolling();

    if (password !== confirmPassword) {
      setRegisterMessage('Password and confirm password must match.');
      setIsSubmitting(false);
      return;
    }

    if (!displayName.trim()) {
      setRegisterMessage('Display name is required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const registerStartTime = Date.now();
      setRegisterMessage('Creating your account and sending your verification email...');
      const response = await axios.post(buildPath('api/auth/register'), {
        email,
        password,
        displayName,
        accountType,
        memberRoleLabel
      });
      const elapsed = Date.now() - registerStartTime;
      if (elapsed < REGISTERING_MESSAGE_MIN_DURATION_MS) {
        await wait(REGISTERING_MESSAGE_MIN_DURATION_MS - elapsed);
      }
      const registrationStatusToken: string | undefined = response.data.registrationStatusToken;
      showLoginMessage(REGISTRATION_STATUS_PENDING_MESSAGE);
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      if (registrationStatusToken) {
        startRegistrationStatusPolling(registrationStatusToken);
      }
    } catch (error: any) {
      const details: string[] | undefined = error?.response?.data?.details;
      if (Array.isArray(details) && details.length > 0) {
        setRegisterMessage(details.join(' | '));
        return;
      }
      const apiError: string | undefined = error?.response?.data?.error;
      setRegisterMessage(apiError || 'Registration failed.');
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
            onClick={() => handleModeChange('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === 'register' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => handleModeChange('register')}
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

        {mode === 'login' && loginMessage && <p className="form-message">{loginMessage}</p>}
        {mode === 'register' && registerMessage && <p className="form-message">{registerMessage}</p>}
      </main>
    </div>
  );
}

export default LoginPage;
