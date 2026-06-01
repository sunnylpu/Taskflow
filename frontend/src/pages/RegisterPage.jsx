/**
 * RegisterPage.jsx — User Registration
 *
 * Security: form data never logged, password field uses type="password",
 * error messages rendered via React JSX (auto-escaped).
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);

  function validate() {
    const errs = {};
    if (!form.email.trim())           errs.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Please enter a valid email.';
    if (!form.password)               errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setServerErrors([]);

    const clientErrs = validate();
    if (Object.keys(clientErrs).length) { setFieldErrors(clientErrs); return; }

    const result = await register(form.email, form.password);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else if (result.errors?.length) {
      setServerErrors(result.errors);
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">TaskFlow</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start managing your tasks in seconds</p>

        {error && (
          <div className="alert alert-error" id="register-error" style={{ marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}

        {serverErrors.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: 20, flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            {serverErrors.map((e, i) => (
              <div key={i}>⚠️ {e.message}</div>
            ))}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
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
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className={`form-input ${fieldErrors.password ? 'error' : ''}`}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
            />
            {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}

            {/* Password strength indicator */}
            {form.password.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <PasswordStrength password={form.password} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              className={`form-input ${fieldErrors.confirm ? 'error' : ''}`}
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              autoComplete="new-password"
            />
            {fieldErrors.confirm && <span className="form-error">{fieldErrors.confirm}</span>}
          </div>

          <button
            id="btn-register"
            type="submit"
            className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account?{' '}
          <Link to="/login" id="link-login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

/** Simple password strength bar — no security logic, just UX feedback */
function PasswordStrength({ password }) {
  const len = password.length;
  let score = 0;
  if (len >= 8)  score++;
  if (len >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#6c63ff'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', color: score > 0 ? colors[score - 1] : 'var(--color-text-dim)' }}>
        {score > 0 ? labels[score - 1] : ''}
      </span>
    </div>
  );
}
