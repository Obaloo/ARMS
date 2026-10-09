import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

/* ─────────────────────────────────────────────
   INJECT STYLES  (shared with LoginPage)
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
  .register-root {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 2rem 1rem;
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
  .register-shell {
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
  .register-panel-left {
    background: var(--ink);
    color: #fff;
    padding: 3rem 2.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  .register-panel-left::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 100%;
    background: var(--gold);
  }

  .register-panel-left::after {
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

  .register-crest {
    width: 52px; height: 52px;
    border: 2px solid var(--gold);
    border-radius: 50%;
    display: grid; place-items: center;
    font-family: 'Playfair Display', serif;
    font-size: 20px; color: var(--gold);
    margin-bottom: 2rem;
    flex-shrink: 0;
  }

  .register-eyebrow {
    font-size: .65rem;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: .75rem;
  }

  .register-headline {
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    line-height: 1.2;
    color: #fff;
    margin-bottom: 1rem;
  }

  .register-subline {
    font-size: .88rem;
    color: rgba(255,255,255,.65);
    line-height: 1.7;
  }

  .register-roles {
    display: flex; flex-direction: column; gap: .35rem;
    margin-top: auto; padding-top: 2.5rem;
  }

  .register-role-item {
    display: flex; align-items: center; gap: .6rem;
    font-size: .75rem; color: rgba(255,255,255,.55);
    letter-spacing: .06em;
  }

  .register-role-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold); flex-shrink: 0;
  }

  /* ── right panel ── */
  .register-panel-right {
    background: #fff;
    padding: 3rem 2.5rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow-y: auto;
  }

  .register-form-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.6rem;
    color: var(--ink);
    margin-bottom: .35rem;
  }

  .register-form-sub {
    font-size: .82rem;
    color: var(--ink-3);
    margin-bottom: 1.75rem;
  }

  /* ── form elements ── */
  .register-field {
    display: flex; flex-direction: column; gap: .3rem;
    margin-bottom: 1rem;
  }

  .register-label {
    font-size: .68rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--ink-3);
    font-weight: 600;
  }

  .register-input {
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

  .register-input:focus {
    border-color: var(--ink-3);
    background: #fff;
  }

  .register-input::placeholder { color: var(--ink-4); }

  /* ── buttons ── */
  .register-btn-primary {
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
    margin-top: .5rem;
  }

  .register-btn-primary:hover:not(:disabled) { background: var(--ink-2); }
  .register-btn-primary:disabled { opacity: .45; cursor: not-allowed; }

  .register-btn-ghost {
    width: 100%;
    padding: .65rem 1rem;
    background: transparent;
    color: var(--gold);
    border: 1px solid var(--gold);
    border-radius: 2px;
    font-family: 'Source Serif 4', serif;
    font-size: .85rem;
    letter-spacing: .04em;
    cursor: pointer;
    transition: all .15s;
    margin-top: 1rem;
  }

  .register-btn-ghost:hover { background: var(--gold-lt); color: var(--ink); }

  /* ── feedback ── */
  .register-feedback {
    display: flex; align-items: flex-start; gap: .6rem;
    padding: .65rem .85rem;
    border-radius: 2px;
    font-size: .82rem;
    margin-bottom: 1rem;
    border-left: 3px solid;
    line-height: 1.5;
  }

  .register-feedback.success {
    background: var(--teal-lt);
    color: var(--teal);
    border-color: var(--teal);
  }

  .register-feedback.error {
    background: var(--red-lt);
    color: var(--red);
    border-color: var(--red);
  }

  /* ── responsive ── */
  @media (max-width: 640px) {
    .register-shell { grid-template-columns: 1fr; }
    .register-panel-left { min-height: 220px; padding: 2rem 1.5rem; }
    .register-panel-right { padding: 2rem 1.5rem; }
    .register-panel-left::after { display: none; }
    .register-roles { flex-direction: row; flex-wrap: wrap; padding-top: 1.5rem; }
  }
`;

if (!document.querySelector('#arms-register-style')) {
  const tag = document.createElement('style');
  tag.id = 'arms-register-style';
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    matricNumber: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register-student', form);
      setMessage('Registration successful! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', { state: { email: form.email } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-root">
      <div className="register-shell">

        {/* ── LEFT: branding panel ── */}
        <div className="register-panel-left">
          <div>
            <div className="register-crest">A</div>
            <p className="register-eyebrow">Attendance &amp; Records Management</p>
            <h1 className="register-headline">CoreNova<br />Platform</h1>
            <p className="register-subline">
              Role-based attendance tracking, session management,
              and reporting for academic institutions.
            </p>
          </div>
          <div className="register-roles">
            {['Super Administrator', 'Lecturer', 'Student'].map((r) => (
              <div key={r} className="register-role-item">
                <span className="register-role-dot" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: registration form panel ── */}
        <div className="register-panel-right">
          <p className="register-form-title">Create Account</p>
          <p className="register-form-sub">Register as a student to get started</p>

          {/* Error feedback (at top) */}
          {error && (
            <div className="register-feedback error">
              <span>✕</span><span>{error}</span>
            </div>
          )}

          {/* Success feedback */}
          {message && (
            <div className="register-feedback success">
              <span>✓</span><span>{message}</span>
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={onSubmit}>
            <div className="register-field">
              <label className="register-label">First name</label>
              <input
                className="register-input"
                type="text"
                placeholder="John"
                value={form.firstName}
                onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
                disabled={loading}
                required
              />
            </div>
            <div className="register-field">
              <label className="register-label">Last name</label>
              <input
                className="register-input"
                type="text"
                placeholder="Doe"
                value={form.lastName}
                onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
                disabled={loading}
                required
              />
            </div>
            <div className="register-field">
              <label className="register-label">Matric number</label>
              <input
                className="register-input"
                type="text"
                placeholder="e.g. CSC/23/001"
                value={form.matricNumber}
                onChange={(e) => setForm((s) => ({ ...s, matricNumber: e.target.value.toUpperCase() }))}
                disabled={loading}
                required
              />
            </div>
            <div className="register-field">
              <label className="register-label">Email address</label>
              <input
                className="register-input"
                type="email"
                placeholder="john@institution.edu"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                disabled={loading}
                required
              />
            </div>
            <div className="register-field">
              <label className="register-label">Password</label>
              <input
                className="register-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                disabled={loading}
                required
              />
            </div>
            <button className="register-btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Link back to sign in */}
          <button
            className="register-btn-ghost"
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
