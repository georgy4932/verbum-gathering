'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sets the session from the URL hash when redirected from the email link.
  // We listen for the PASSWORD_RECOVERY event to know the session is active.
  useEffect(() => {
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setSessionReady(true);
        }
      }
    );
    // Also check if there's already a session (e.g. arrived via callback route)
    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('At least 8 characters.'); return; }
    if (!/[A-Z]/.test(password)) { setError('Include at least one uppercase letter.'); return; }
    if (!/[a-z]/.test(password)) { setError('Include at least one lowercase letter.'); return; }
    if (!/[0-9]/.test(password)) { setError('Include at least one number.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const { error: err } = await supabaseBrowser.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError(err.message); return; }

    setDone(true);
    setTimeout(() => {
      router.push('/auth/signin');
    }, 2500);
  }

  if (!sessionReady) {
    return (
      <main style={{ padding: '4rem 1.25rem 6rem' }}>
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <p style={{ color: 'var(--stone)', fontSize: 15 }}>Verifying your reset link…</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main style={{ padding: '4rem 1.25rem 6rem' }}>
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <div style={{ padding: '24px 20px', borderRadius: 14, border: '1px solid rgba(94,167,115,0.3)', background: 'rgba(94,167,115,0.07)' }}>
            <p style={{ fontSize: 15, color: 'var(--stone)', lineHeight: 1.75, margin: 0 }}>
              Password updated. Redirecting you to sign in…
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '4rem 1.25rem 6rem' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        <p style={eyebrowStyle}>Reset password</p>
        <h1 style={headingStyle}>Set a new password.</h1>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, marginTop: 28 }}>
          {error && <div style={errorStyle}>{error}</div>}

          <label style={labelStyle}>
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              style={inputStyle}
            />
            <span style={hintStyle}>Min 8 chars — uppercase, lowercase, and a number</span>
          </label>

          <label style={labelStyle}>
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              style={inputStyle}
            />
          </label>

          <button type="submit" disabled={loading} style={primaryBtnStyle}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link href="/auth/signin" style={quietLinkStyle}>← Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase',
  color: 'var(--gold-lo)', marginBottom: 14,
};
const headingStyle: React.CSSProperties = {
  fontFamily: "'IM Fell English', serif",
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  lineHeight: 1.05, margin: '0 0 10px', color: 'var(--cream)',
};
const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 6,
  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--stone)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', minHeight: 46, padding: '0 14px',
  borderRadius: 10, border: '1px solid var(--faint)',
  background: 'rgba(255,255,255,0.04)', color: 'var(--cream)',
  fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  fontWeight: 400, letterSpacing: 0,
};
const primaryBtnStyle: React.CSSProperties = {
  width: '100%', minHeight: 46, padding: '0 20px',
  borderRadius: 999, border: 'none',
  background: 'var(--gold)', color: 'var(--bg)',
  fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
};
const quietLinkStyle: React.CSSProperties = {
  fontSize: 13, color: 'var(--stone)', textDecoration: 'none',
};
const hintStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 400, letterSpacing: 0, textTransform: 'none',
  color: 'var(--stone)', opacity: 0.7,
};
const errorStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10,
  background: 'rgba(192,112,96,0.1)', border: '1px solid rgba(192,112,96,0.3)',
  color: '#c07060', fontSize: 14, lineHeight: 1.6,
};
