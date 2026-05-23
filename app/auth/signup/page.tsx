'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { checkUsernameAvailable } from '@/app/actions/auth';

type FieldError = Partial<Record<'email' | 'password' | 'display_name' | 'username', string>>;

export default function SignUpPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    display_name: '',
    username: '',
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [done, setDone] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
    };
  }

  function validate(): FieldError {
    const e: FieldError = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    if (!form.display_name.trim()) e.display_name = 'Display name is required.';
    else if (form.display_name.trim().length > 60) e.display_name = 'Display name must be 60 characters or fewer.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'At least 8 characters.';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Include at least one uppercase letter.';
    else if (!/[a-z]/.test(form.password)) e.password = 'Include at least one lowercase letter.';
    else if (!/[0-9]/.test(form.password)) e.password = 'Include at least one number.';
    if (form.username && !/^[a-z0-9_-]{3,20}$/.test(form.username)) {
      e.username = '3–20 characters: lowercase letters, numbers, _ or -';
    }
    return e;
  }

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setNotice(null);

    // Check username availability if provided
    if (form.username) {
      const available = await checkUsernameAvailable(form.username);
      if (!available) {
        setErrors((err) => ({ ...err, username: 'That username is already taken.' }));
        setLoading(false);
        return;
      }
    }

    const { data, error } = await supabaseBrowser.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        data: {
          display_name: form.display_name.trim(),
          username: form.username || null,
        },
      },
    });

    if (error) {
      setLoading(false);
      setNotice({ kind: 'error', text: error.message });
      return;
    }

    // Save display_name and username to profile if signUp succeeded
    // (Supabase may create a session immediately when confirm email is disabled,
    //  or it may not — handle both cases)
    if (data.user) {
      await supabaseBrowser.from('profiles').upsert({
        id: data.user.id,
        display_name: form.display_name.trim(),
        email: form.email.trim(),
        ...(form.username ? { username: form.username } : {}),
      }, { onConflict: 'id' });
    }

    setLoading(false);
    setDone(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  async function handleGoogle() {
    setGoogleLoading(true);
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

  if (done) {
    return (
      <main style={{ padding: '4rem 1.25rem 6rem' }}>
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <div style={{
            padding: '28px 24px',
            borderRadius: 16,
            border: '1px solid rgba(94,167,115,0.3)',
            background: 'rgba(94,167,115,0.07)',
          }}>
            <h2 style={{ fontFamily: "'IM Fell English', serif", margin: '0 0 12px', color: 'var(--cream)', fontSize: '1.4rem' }}>
              Check your inbox
            </h2>
            <p style={{ fontSize: 15, color: 'var(--stone)', lineHeight: 1.75, margin: '0 0 20px' }}>
              We sent a confirmation link to <strong style={{ color: 'var(--cream)' }}>{form.email}</strong>.
              Click the link to verify your email, then sign in.
            </p>
            <Link href="/auth/signin" style={primaryBtnLinkStyle}>
              Go to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '4rem 1.25rem 6rem' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>

        <p style={eyebrowStyle}>Create account</p>
        <h1 style={headingStyle}>Begin your journey.</h1>
        <p style={subtitleStyle}>
          Join a community devoted to Scripture, prayer, and fellowship.
        </p>

        {notice && (
          <div style={noticeStyle(notice.kind)}>{notice.text}</div>
        )}

        <form onSubmit={handleSignUp} style={{ display: 'grid', gap: 14 }}>
          <Field label="Display name" hint="How others will see you" error={errors.display_name}>
            <input
              type="text"
              value={form.display_name}
              onChange={set('display_name')}
              placeholder="Grace Walker"
              required
              maxLength={60}
              style={inputStyle(!!errors.display_name)}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              required
              autoComplete="email"
              style={inputStyle(!!errors.email)}
            />
          </Field>

          <Field
            label="Password"
            hint="Min 8 chars — uppercase, lowercase, and a number"
            error={errors.password}
          >
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              style={inputStyle(!!errors.password)}
            />
          </Field>

          <Field
            label={<>Username <span style={{ fontWeight: 400, opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></>}
            hint="3–20 chars, lowercase, numbers, _ or -"
            error={errors.username}
          >
            <input
              type="text"
              value={form.username}
              onChange={set('username')}
              placeholder="grace_walker"
              autoComplete="username"
              style={inputStyle(!!errors.username)}
            />
          </Field>

          <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Create account'}
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
          Already have an account?{' '}
          <Link href="/auth/signin" style={accentLinkStyle}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label, hint, error, children,
}: {
  label: React.ReactNode;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: error ? '#c07060' : 'var(--stone)',
    }}>
      {label}
      {children}
      {hint && !error && <span style={{ fontSize: 11, fontWeight: 400, letterSpacing: 0, textTransform: 'none', color: 'var(--stone)', opacity: 0.7 }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, fontWeight: 400, letterSpacing: 0, textTransform: 'none', color: '#c07060' }}>{error}</span>}
    </label>
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
const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%', minHeight: 46, padding: '0 14px',
  borderRadius: 10,
  border: `1px solid ${hasError ? 'rgba(192,112,96,0.5)' : 'var(--faint)'}`,
  background: 'rgba(255,255,255,0.04)', color: 'var(--cream)',
  fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  fontWeight: 400, letterSpacing: 0, textTransform: 'none',
});
const primaryBtnStyle: React.CSSProperties = {
  width: '100%', minHeight: 46, padding: '0 20px',
  borderRadius: 999, border: 'none',
  background: 'var(--gold)', color: 'var(--bg)',
  fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
};
const primaryBtnLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '10px 24px', borderRadius: 999,
  background: 'var(--gold)', color: 'var(--bg)',
  fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textDecoration: 'none',
};
const googleBtnStyle: React.CSSProperties = {
  width: '100%', minHeight: 46, padding: '0 20px',
  borderRadius: 999, border: '1px solid var(--faint)',
  background: 'rgba(255,255,255,0.04)', color: 'var(--cream)',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  fontFamily: "'DM Sans', sans-serif",
};
const accentLinkStyle: React.CSSProperties = {
  color: 'var(--companion)', textDecoration: 'none',
};
const footerStyle: React.CSSProperties = {
  marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--stone)',
};
const noticeStyle = (kind: 'error' | 'success'): React.CSSProperties => ({
  padding: '12px 16px', borderRadius: 10, marginBottom: 16,
  background: kind === 'error' ? 'rgba(192,112,96,0.1)' : 'rgba(94,167,115,0.1)',
  border: `1px solid ${kind === 'error' ? 'rgba(192,112,96,0.3)' : 'rgba(94,167,115,0.3)'}`,
  color: kind === 'error' ? '#c07060' : '#5ea773',
  fontSize: 14, lineHeight: 1.6,
});

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
