'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    const { error: err } = await supabaseBrowser.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      }
    );

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setDone(true);
  }

  return (
    <main style={{ padding: '4rem 1.25rem 6rem' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>
        <p style={eyebrowStyle}>Password reset</p>
        <h1 style={headingStyle}>Recover access.</h1>
        <p style={subtitleStyle}>
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>

        {done ? (
          <div style={{
            padding: '24px 20px', borderRadius: 14,
            border: '1px solid rgba(94,167,115,0.3)',
            background: 'rgba(94,167,115,0.07)',
          }}>
            <p style={{ fontSize: 15, color: 'var(--stone)', lineHeight: 1.75, margin: '0 0 16px' }}>
              If an account exists for <strong style={{ color: 'var(--cream)' }}>{email}</strong>,
              a reset link has been sent. Check your inbox.
            </p>
            <Link href="/auth/signin" style={quietLinkStyle}>← Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            {error && <div style={errorStyle}>{error}</div>}

            <label style={labelStyle}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={inputStyle}
              />
            </label>

            <button type="submit" disabled={loading} style={primaryBtnStyle}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <Link href="/auth/signin" style={{ ...quietLinkStyle, textAlign: 'center', display: 'block', marginTop: 4 }}>
              ← Back to sign in
            </Link>
          </form>
        )}
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
const subtitleStyle: React.CSSProperties = {
  fontSize: 15, color: 'var(--stone)', lineHeight: 1.75, marginBottom: 28,
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
const errorStyle: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10,
  background: 'rgba(192,112,96,0.1)', border: '1px solid rgba(192,112,96,0.3)',
  color: '#c07060', fontSize: 14, lineHeight: 1.6,
};
