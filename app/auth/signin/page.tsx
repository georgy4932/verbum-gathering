'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Suspense } from 'react';

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const confirmed = params.get('confirmed') === '1';
  const errorParam = params.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(
    confirmed ? { kind: 'success', text: 'Email confirmed — welcome. Sign in to continue.' }
    : errorParam ? { kind: 'error', text: 'Something went wrong. Please try again.' }
    : null
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setNotice(null);

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setNotice({ kind: 'error', text: 'Please verify your email before signing in. Check your inbox for the confirmation link.' });
      } else if (error.message.toLowerCase().includes('invalid login')) {
        setNotice({ kind: 'error', text: 'Incorrect email or password.' });
      } else {
        setNotice({ kind: 'error', text: error.message });
      }
      return;
    }

    router.push('/');
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setNotice(null);
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) {
      setGoogleLoading(false);
      setNotice({ kind: 'error', text: error.message });
    }
  }

  return (
    <main style={{ padding: '4rem 1.25rem 6rem' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>

        <p style={eyebrowStyle}>Sign in</p>
        <h1 style={headingStyle}>Enter quietly.</h1>
        <p style={subtitleStyle}>
          Access your Scripture notes, AI companion, gatherings, and more.
        </p>

        {notice && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 10,
            marginBottom: 20,
            background: notice.kind === 'error' ? 'rgba(192,112,96,0.1)' : 'rgba(94,167,115,0.1)',
            border: `1px solid ${notice.kind === 'error' ? 'rgba(192,112,96,0.3)' : 'rgba(94,167,115,0.3)'}`,
            color: notice.kind === 'error' ? '#c07060' : '#5ea773',
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            {notice.text}
            {notice.kind === 'error' && notice.text.includes('verify your email') && (
              <ResendLink email={email} />
            )}
          </div>
        )}

        <form onSubmit={handleSignIn} style={{ display: 'grid', gap: 12 }}>
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

          <label style={labelStyle}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </label>

          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <Link href="/auth/forgot-password" style={quietLinkStyle}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} style={primaryBtnStyle}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Divider />

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          style={googleBtnStyle}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <p style={footerStyle}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" style={accentLinkStyle}>Sign up</Link>
        </p>
      </div>
    </main>
  );
}

function ResendLink({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function resend() {
    if (!email.trim() || sending) return;
    setSending(true);
    await supabaseBrowser.auth.resend({ type: 'signup', email: email.trim() });
    setSending(false);
    setSent(true);
  }

  return (
    <span style={{ display: 'block', marginTop: 6, fontSize: 13 }}>
      {sent ? 'Verification email sent.' : (
        <button
          type="button"
          onClick={resend}
          disabled={sending}
          style={{ background: 'none', border: 'none', padding: 0, color: '#c07060', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}
        >
          {sending ? 'Sending…' : 'Resend verification email'}
        </button>
      )}
    </span>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

// ── Shared styles ────────────────────────────────────────────────────

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
  marginTop: 4,
};
const googleBtnStyle: React.CSSProperties = {
  width: '100%', minHeight: 46, padding: '0 20px',
  borderRadius: 999, border: '1px solid var(--faint)',
  background: 'rgba(255,255,255,0.04)', color: 'var(--cream)',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  fontFamily: "'DM Sans', sans-serif",
};
const quietLinkStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--stone)', textDecoration: 'none',
};
const accentLinkStyle: React.CSSProperties = {
  color: 'var(--companion)', textDecoration: 'none',
};
const footerStyle: React.CSSProperties = {
  marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--stone)',
};

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--faint)' }} />
      <span style={{ fontSize: 11, color: 'var(--stone)', letterSpacing: '0.1em' }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'var(--faint)' }} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
