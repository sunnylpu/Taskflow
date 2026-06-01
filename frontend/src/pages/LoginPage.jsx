/**
 * LoginPage.jsx — User Login
 *
 * Security: form data never logged, error messages from server displayed via
 * React JSX (auto-escaped), no dangerouslySetInnerHTML.
 */

import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!form.email.trim())    { setFieldErrors({ email: 'Email is required.' }); return; }
    if (!form.password)        { setFieldErrors({ password: 'Password is required.' }); return; }

    const result = await login(form.email, form.password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || 'Login failed. Please try again.');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">TaskFlow</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {error && (
          <div className="alert alert-error" id="login-error" style={{ marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className={`form-input ${fieldErrors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              autoComplete="email"
              autoFocus
            />
            {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`form-input ${fieldErrors.password ? 'error' : ''}`}
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
            />
            {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
          </div>

          <button
            id="btn-login"
            type="submit"
            className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-link">
          Don&apos;t have an account?{' '}
          <Link to="/register" id="link-register">Create one</Link>
        </p>

        <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(108,99,255,0.08)', borderRadius: 10, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          <strong style={{ color: 'var(--color-primary)' }}>Demo credentials</strong><br />
          Register a new account to get started, or use admin credentials if pre-seeded.
        </div>
      </div>
    </div>
  );
}
