import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../state/AuthContext';

/* ─────────────────────────────────────────────
   INJECT STYLES  (scoped, matches DashboardPage tokens)
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300&family=JetBrains+Mono:wght@400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:       #1a1814;
    --ink-2:     #3b3730;
    --ink-3:     #6b6358;
    --ink-4:     #9e9488;
    --parchment: #faf8f4;
    --cream:     #f3efe8;
    --rule:      #e2ddd5;
    --gold:      #b5892a;
    --gold-lt:   #f0e4c4;
    --teal:      #1a5c55;
    --teal-lt:   #d4ece9;
    --red:       #8b2020;
    --red-lt:    #f5dcdc;
  }

  body {
    background: var(--parchment);
    color: var(--ink);
    font-family: 'Source Serif 4', Georgia, serif;
  }

  /* ── full-screen layout ── */
  .login-root {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 2rem 1rem;
    /* subtle ruled-paper texture */
    background-color: var(--parchment);
    background-image:
      repeating-linear-gradient(
        transparent,
        transparent 31px,
        #e8e3d9 31px,
        #e8e3d9 32px
      );
  }

  /* ── outer shell ── */
  .login-shell {
    width: 100%;
    max-width: 860px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 540px;
    box-shadow:
      0 4px 6px rgba(26,24,20,.06),
      0 12px 40px rgba(26,24,20,.10);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--rule);
  }

  /* ── left panel ── */
  .login-panel-left {
    background: var(--ink);
    color: #fff;
    padding: 3rem 2.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  /* decorative vertical gold rule */
  .login-panel-left::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 100%;
    background: var(--gold);
  }

  /* decorative serif watermark */
  .login-panel-left::after {
    content: 'A';
    position: absolute;
    bottom: -2rem; right: -1.5rem;
    font-family: 'Playfair Display', serif;
    font-size: 14rem;
    color: rgba(255,255,255,.035);
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }

  .login-crest {
    width: 52px; height: 52px;
    border: 2px solid var(--gold);
    border-radius: 50%;
    display: grid; place-items: center;
    font-family: 'Playfair Display', serif;
    font-size: 20px; color: var(--gold);
    margin-bottom: 2rem;
    flex-shrink: 0;
  }

  .login-eyebrow {
    font-size: .65rem;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: .75rem;
  }

  .login-headline {
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    line-height: 1.2;
    color: #fff;
    margin-bottom: 1rem;
  }

  .login-subline {
    font-size: .88rem;
    color: rgba(255,255,255,.65);
    line-height: 1.7;
  }

  .login-roles {
    display: flex; flex-direction: column; gap: .35rem;
    margin-top: auto; padding-top: 2.5rem;
  }

  .login-role-item {
    display: flex; align-items: center; gap: .6rem;
    font-size: .75rem; color: rgba(255,255,255,.55);
    letter-spacing: .06em;
  }

  .login-role-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold); flex-shrink: 0;
  }

  /* ── right panel ── */
  .login-panel-right {
    background: #fff;
    padding: 3rem 2.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .login-form-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.6rem;
    color: var(--ink);
    margin-bottom: .35rem;
  }

  .login-form-sub {
    font-size: .82rem;
    color: var(--ink-3);
    margin-bottom: 1.75rem;
  }

  /* ── form elements ── */
  .login-field {
    display: flex; flex-direction: column; gap: .3rem;
    margin-bottom: 1rem;
  }

  .login-label {
    font-size: .68rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--ink-3);
    font-weight: 600;
  }

  .login-input {
    width: 100%;
    padding: .65rem .85rem;
    border: 1px solid var(--rule);
    border-radius: 2px;
    background: var(--parchment);
    color: var(--ink);
    font-family: 'Source Serif 4', serif;
    font-size: .92rem;
    outline: none;
    transition: border-color .15s, background .15s;
  }

  .login-input:focus {
    border-color: var(--ink-3);
    background: #fff;
  }

  .login-input::placeholder { color: var(--ink-4); }

  /* ── buttons ── */
  .login-btn-primary {
    width: 100%;
    padding: .75rem 1rem;
    background: var(--ink);
    color: #fff;
    border: none;
    border-radius: 2px;
    font-family: 'Source Serif 4', serif;
    font-size: .9rem;
    letter-spacing: .06em;
    cursor: pointer;
    transition: background .15s;
    margin-top: .25rem;
  }

  .login-btn-primary:hover:not(:disabled) { background: var(--ink-2); }
  .login-btn-primary:disabled { opacity: .45; cursor: not-allowed; }

  .login-btn-ghost {
    width: 100%;
    padding: .65rem 1rem;
    background: transparent;
    color: var(--ink-2);
    border: 1px solid var(--rule);
    border-radius: 2px;
    font-family: 'Source Serif 4', serif;
    font-size: .85rem;
    letter-spacing: .04em;
    cursor: pointer;
    transition: border-color .15s, color .15s;
    margin-top: .25rem;
  }

  .login-btn-ghost:hover { border-color: var(--ink-3); color: var(--ink); }

  /* ── divider ── */
  .login-divider {
    display: flex; align-items: center; gap: .75rem;
    margin: 1.5rem 0 1.25rem;
  }

  .login-divider::before,
  .login-divider::after {
    content: ''; flex: 1; height: 1px; background: var(--rule);
  }

  .login-divider-text {
    font-size: .68rem;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--ink-4);
    white-space: nowrap;
  }

  /* ── feedback ── */
  .login-feedback {
    display: flex; align-items: flex-start; gap: .6rem;
    padding: .65rem .85rem;
    border-radius: 2px;
    font-size: .82rem;
    margin-top: 1rem;
    border-left: 3px solid;
    line-height: 1.5;
  }

  .login-feedback.success {
    background: var(--teal-lt);
    color: var(--teal);
    border-color: var(--teal);
  }

  .login-feedback.error {
    background: var(--red-lt);
    color: var(--red);
    border-color: var(--red);
  }

  /* ── responsive ── */
  @media (max-width: 640px) {
    .login-shell { grid-template-columns: 1fr; }
    .login-panel-left { min-height: 220px; padding: 2rem 1.5rem; }
    .login-panel-right { padding: 2rem 1.5rem; }
    .login-panel-left::after { display: none; }
    .login-roles { flex-direction: row; flex-wrap: wrap; padding-top: 1.5rem; }
  }
`;

if (!document.querySelector('#arms-login-style')) {
  const tag = document.createElement('style');
  tag.id = 'arms-login-style';
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const notice = sessionStorage.getItem('arms_logout_feedback');
    if (notice) {
      setMessage(notice);
      sessionStorage.removeItem('arms_logout_feedback');
    }
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const onForgotPassword = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    }
  };

  return (
    <div className="login-root">
      <div className="login-shell">

        {/* ── LEFT: branding panel ── */}
        <div className="login-panel-left">
          <div>
            <div className="login-crest">A</div>
            <p className="login-eyebrow">Attendance &amp; Records Management</p>
            <h1 className="login-headline">CoreNova<br />Platform</h1>
            <p className="login-subline">
              Role-based attendance tracking, session management,
              and reporting for academic institutions.
            </p>
          </div>
          <div className="login-roles">
            {['Super Administrator', 'Lecturer', 'Student'].map((r) => (
              <div key={r} className="login-role-item">
                <span className="login-role-dot" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: forms panel ── */}
        <div className="login-panel-right">
          <p className="login-form-title">Sign In</p>
          <p className="login-form-sub">Enter your credentials to access the portal</p>

          {/* Sign In Error (at top for visibility) */}
          {error && (
            <div className="login-feedback error">
              <span>✕</span><span>{error}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={onSubmit}>
            <div className="login-field">
              <label className="login-label">Email address</label>
              <input
                className="login-input"
                type="email"
                placeholder="you@institution.edu"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <div className="login-field">
              <label className="login-label">Password</label>
              <input
                className="login-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              />
            </div>
            <button className="login-btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span className="login-divider-text">Forgot your password?</span>
          </div>

          {/* Forgot password form */}
          <form onSubmit={onForgotPassword}>
            <div className="login-field">
              <label className="login-label">Account email</label>
              <input
                className="login-input"
                type="email"
                placeholder="Enter your registered email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <button className="login-btn-ghost" type="submit">
              Send reset link
            </button>
          </form>

          {/* Link to registration */}
          <div className="login-divider">
            <span className="login-divider-text">New student?</span>
          </div>
          <button
            type="button"
            className="login-btn-primary"
            onClick={() => navigate('/register')}
            style={{ background: 'var(--gold)', color: 'var(--ink)' }}
          >
            Create an account
          </button>

          {/* Feedback */}
          {message && (
            <div className="login-feedback success">
              <span>✓</span><span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;