import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { storeToken } from '../tokenStorage';
import { buildPath } from '../utils/api';
import { storeUser } from '../utils/session';

function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying your email...');
  const [isError, setIsError] = useState(false);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setIsError(true);
      setMessage('Missing verification token.');
      return;
    }

    if (hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;
    void verifyEmail(token);
  }, [searchParams]);

  async function verifyEmail(token: string): Promise<void> {
    try {
      const response = await axios.get(buildPath(`api/auth/verify?token=${encodeURIComponent(token)}`));
      const accessToken: string | undefined = response.data.accessToken;
      const user = response.data.user;

      if (accessToken && user) {
        storeToken(accessToken);
        storeUser(user);
      }

      setIsError(false);
      setMessage(response.data.message || 'Email verified successfully. Logging you in now.');

      if (accessToken && user) {
        window.setTimeout(() => {
          navigate('/home', { replace: true });
        }, 1200);
      }
    } catch (error: any) {
      const apiError: string | undefined = error?.response?.data?.error;
      setIsError(true);
      setMessage(apiError || 'Unable to verify email.');
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="brand-copy">
          <h1 className="brand-title">Garage Jam</h1>
          <p className="brand-subtitle">Account Email Verification</p>
        </div>
        <img className="header-logo" src="/UCF_Knights_logo.svg" alt="UCF logo" />
      </header>

      <main className="auth-card">
        <h2>{isError ? 'Verification Problem' : 'Email Verification'}</h2>
        <p className={isError ? 'form-message error-text' : 'success-text'}>{message}</p>
        {isError ? <Link className="secondary-btn inline-link-btn" to="/">Back to Login</Link> : null}
      </main>
    </div>
  );
}

export default VerifyEmailPage;
