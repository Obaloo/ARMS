import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

/* ─────────────────────────────────────────────
   STYLES  (reuses shared tokens from Login/Dashboard)
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300&display=swap');

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

  /* ── page ── */
  .rp-root {
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

  /* ── card ── */
  .rp-card {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border: 1px solid var(--rule);
    border-radius: 4px;
    overflow: hidden;
    box-shadow:
      0 4px 6px rgba(26,24,20,.05),
      0 12px 32px rgba(26,24,20,.09);
  }

  /* gold top rule */
  .rp-card-top {
    height: 3px;
    background: var(--gold);
  }

  .rp-card-body {
    padding: 2.5rem 2.25rem;
  }

  /* ── header ── */
  .rp-header {
    display: flex;
    align-items: center;
    gap: .9rem;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--rule);
  }

  .rp-crest {
    width: 40px; height: 40px; flex-shrink: 0;
    border: 2px solid var(--gold);
    border-radius: 50%;
    display: grid; place-items: center;
    font-family: 'Playfair Display', serif;
    font-size: 16px; color: var(--gold);
  }

  .rp-header-text {}

  .rp-eyebrow {
    font-size: .62rem;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: .2rem;
  }

  .rp-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.35rem;
    color: var(--ink);
    line-height: 1.2;
  }

  /* ── body text ── */
  .rp-description {
    font-size: .85rem;
    color: var(--ink-3);
    line-height: 1.65;
    margin-bottom: 1.5rem;
  }

  /* ── form ── */
  .rp-field {
    display: flex; flex-direction: column; gap: .3rem;
    margin-bottom: 1.1rem;
  }

  .rp-label {
    font-size: .68rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--ink-3);
    font-weight: 600;
  }

  .rp-input {
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

  .rp-input:focus {
    border-color: var(--ink-3);
    background: #fff;
  }

  .rp-input::placeholder { color: var(--ink-4); }

  /* ── button ── */
  .rp-btn {
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
    margin-top: .15rem;
  }

  .rp-btn:hover:not(:disabled) { background: var(--ink-2); }
  .rp-btn:disabled { opacity: .45; cursor: not-allowed; }

  /* ── success state ── */
  .rp-success-icon {
    width: 52px; height: 52px;
    border: 2px solid var(--teal);
    border-radius: 50%;
    display: grid; place-items: center;
    font-size: 1.4rem;
    color: var(--teal);
    margin: 0 auto 1.25rem;
  }

  .rp-success-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem;
    color: var(--ink);
    text-align: center;
    margin-bottom: .5rem;
  }

  .rp-success-body {
    font-size: .85rem;
    color: var(--ink-3);
    line-height: 1.65;
    text-align: center;
    margin-bottom: 1.5rem;
  }

  /* ── feedback ── */
  .rp-feedback {
    display: flex; align-items: flex-start; gap: .6rem;
    padding: .65rem .85rem;
    border-radius: 2px;
    font-size: .82rem;
    margin-top: 1rem;
    border-left: 3px solid;
    line-height: 1.5;
  }

  .rp-feedback.error {
    background: var(--red-lt);
    color: var(--red);
    border-color: var(--red);
  }

  /* ── back link ── */
  .rp-back {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: var(--ink-3);
    text-decoration: none;
    letter-spacing: .04em;
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--rule);
    transition: color .15s;
  }

  .rp-back:hover { color: var(--ink); }
  .rp-back-arrow { font-size: .7rem; }
`;

if (!document.querySelector('#arms-reset-style')) {
  const tag = document.createElement('style');
  tag.id = 'arms-reset-style';
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="rp-root">
      <div className="rp-card">
        <div className="rp-card-top" />
        <div className="rp-card-body">

          {/* ── Header ── */}
          <div className="rp-header">
            <div className="rp-crest">A</div>
            <div className="rp-header-text">
              <p className="rp-eyebrow">CoreNova Platform</p>
              <h1 className="rp-title">Reset Password</h1>
            </div>
          </div>

          {/* ── Success state ── */}
          {message ? (
            <div>
              <div className="rp-success-icon">✓</div>
              <p className="rp-success-title">Password Updated</p>
              <p className="rp-success-body">{message}</p>
              <Link to="/login" className="rp-back" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 0 }}>
                <span className="rp-back-arrow">←</span>
                Return to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <p className="rp-description">
                Enter a new password for your account. Choose something secure
                that you have not used before.
              </p>

              <form onSubmit={onSubmit}>
                <div className="rp-field">
                  <label className="rp-label">New password</label>
                  <input
                    className="rp-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button className="rp-btn" type="submit">
                  Set New Password
                </button>
              </form>

              {error && (
                <div className="rp-feedback error">
                  <span>✕</span><span>{error}</span>
                </div>
              )}

              <Link to="/login" className="rp-back">
                <span className="rp-back-arrow">←</span>
                Back to sign in
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;