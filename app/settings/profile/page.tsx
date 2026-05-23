'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { updateProfile, signOutAction, checkUsernameAvailable } from '@/app/actions/auth';

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_public: boolean;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    is_public: false,
  });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (!user) { router.push('/auth/signin'); return; }

      const { data: p } = await supabaseBrowser
        .from('profiles')
        .select('id, email, display_name, username, bio, avatar_url, is_public')
        .eq('id', user.id)
        .maybeSingle();

      if (p) {
        setProfile(p as Profile);
        setForm({
          display_name: p.display_name ?? '',
          username: p.username ?? '',
          bio: p.bio ?? '',
          is_public: p.is_public ?? false,
        });
      }
    }
    load();
  }, [router]);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: field === 'is_public' ? (e.target as HTMLInputElement).checked : e.target.value }));
      if (field === 'username') setUsernameError('');
    };
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) { setNotice({ kind: 'error', text: 'Please upload an image file.' }); return; }
    if (file.size > 5 * 1024 * 1024) { setNotice({ kind: 'error', text: 'Image must be under 5 MB.' }); return; }

    setAvatarUploading(true);
    setNotice(null);

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabaseBrowser.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setAvatarUploading(false);
      setNotice({ kind: 'error', text: 'Upload failed. Please try again.' });
      return;
    }

    const { data: urlData } = supabaseBrowser.storage.from('avatars').getPublicUrl(path);
    const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;

    const result = await updateProfile({ avatar_url });
    setAvatarUploading(false);

    if (result.success) {
      setProfile((p) => p ? { ...p, avatar_url } : p);
      setNotice({ kind: 'success', text: 'Avatar updated.' });
    } else {
      setNotice({ kind: 'error', text: result.error });
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);

    if (!form.display_name.trim()) {
      setNotice({ kind: 'error', text: 'Display name is required.' });
      return;
    }

    if (form.username && form.username !== profile?.username) {
      if (!/^[a-z0-9_-]{3,20}$/.test(form.username)) {
        setUsernameError('3–20 characters: lowercase letters, numbers, _ or -');
        return;
      }
      const available = await checkUsernameAvailable(form.username);
      if (!available) {
        setUsernameError('That username is already taken.');
        return;
      }
    }

    setSaving(true);
    const result = await updateProfile({
      display_name: form.display_name,
      username: form.username || null,
      bio: form.bio || null,
      is_public: form.is_public,
    });
    setSaving(false);

    if (result.success) {
      setProfile((p) => p ? { ...p, ...form, username: form.username || null, bio: form.bio || null } : p);
      setNotice({ kind: 'success', text: 'Profile saved.' });
    } else {
      setNotice({ kind: 'error', text: result.error });
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOutAction();
    router.push('/');
    router.refresh();
  }

  if (!profile) {
    return (
      <main style={{ padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{ color: 'var(--stone)' }}>Loading…</p>
        </div>
      </main>
    );
  }

  const initials = (profile.display_name ?? profile.email ?? '?')
    .split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <main style={{ padding: '3rem 1.25rem 6rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--stone)', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: 'var(--faint2)' }}>›</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Profile settings</span>
        </div>

        <p style={eyebrowStyle}>Settings</p>
        <h1 style={headingStyle}>Your Profile</h1>

        {notice && (
          <div style={noticeStyle(notice.kind)}>{notice.text}</div>
        )}

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36, marginTop: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
            border: '2px solid var(--faint)',
            background: 'var(--bg3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Your avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 22, fontWeight: 700,
                color: 'var(--gold)', letterSpacing: '0.02em',
              }}>{initials}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              style={secondaryBtnStyle}
            >
              {avatarUploading ? 'Uploading…' : 'Change avatar'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.7 }}>
              JPG, PNG, WebP · max 5 MB
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} style={{ display: 'grid', gap: 18 }}>
          <Field label="Display name" required>
            <input
              type="text"
              value={form.display_name}
              onChange={set('display_name')}
              placeholder="Grace Walker"
              required
              maxLength={60}
              style={inputStyle}
            />
          </Field>

          <Field
            label={<>Username <span style={{ fontWeight: 400, opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></>}
            hint={usernameError || '3–20 chars, lowercase, numbers, _ or -'}
            hintIsError={!!usernameError}
          >
            <input
              type="text"
              value={form.username}
              onChange={set('username')}
              placeholder="grace_walker"
              maxLength={20}
              style={{ ...inputStyle, borderColor: usernameError ? 'rgba(192,112,96,0.5)' : undefined }}
            />
          </Field>

          <Field label="Bio" hint="A short description, up to 200 characters">
            <textarea
              value={form.bio}
              onChange={set('bio')}
              placeholder="A servant of the Word…"
              maxLength={200}
              rows={3}
              style={{
                ...inputStyle,
                minHeight: 'unset',
                padding: '10px 14px',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={profile.email ?? ''}
              disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
            />
          </Field>

          {/* Profile visibility */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderRadius: 10,
            border: '1px solid var(--faint)',
            background: 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--gold)' }}
            />
            <span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>Public profile</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--stone)', marginTop: 2 }}>
                Allow others to view your profile page
              </span>
            </span>
          </label>

          <button type="submit" disabled={saving} style={primaryBtnStyle}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {/* Danger zone */}
        <div style={{
          marginTop: 48, paddingTop: 28,
          borderTop: '1px solid var(--faint)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 16 }}>
            Account
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/auth/forgot-password" style={secondaryBtnStyle}>
              Change password
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              style={{ ...secondaryBtnStyle, color: '#c07060', borderColor: 'rgba(192,112,96,0.3)' }}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}

function Field({
  label, hint, hintIsError = false, required: req = false, children,
}: {
  label: React.ReactNode;
  hint?: string;
  hintIsError?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{
      display: 'flex', flexDirection: 'column', gap: 7,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: hintIsError ? '#c07060' : 'var(--stone)',
    }}>
      {label}{req && <span style={{ color: 'var(--gold)', display: 'inline' }}> *</span>}
      {children}
      {hint && (
        <span style={{
          fontSize: 11, fontWeight: 400, letterSpacing: 0, textTransform: 'none',
          color: hintIsError ? '#c07060' : 'var(--stone)', opacity: hintIsError ? 1 : 0.7,
        }}>
          {hint}
        </span>
      )}
    </label>
  );
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase',
  color: 'var(--gold-lo)', marginBottom: 10,
};
const headingStyle: React.CSSProperties = {
  fontFamily: "'IM Fell English', serif",
  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
  lineHeight: 1.05, margin: '0 0 4px', color: 'var(--cream)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', minHeight: 46, padding: '0 14px',
  borderRadius: 10, border: '1px solid var(--faint)',
  background: 'rgba(255,255,255,0.04)', color: 'var(--cream)',
  fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  fontWeight: 400, letterSpacing: 0, textTransform: 'none',
};
const primaryBtnStyle: React.CSSProperties = {
  width: '100%', minHeight: 46, padding: '0 20px',
  borderRadius: 999, border: 'none',
  background: 'var(--gold)', color: 'var(--bg)',
  fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
};
const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', borderRadius: 999,
  border: '1px solid var(--faint)',
  background: 'transparent',
  color: 'var(--muted)', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none',
};
const noticeStyle = (kind: 'error' | 'success'): React.CSSProperties => ({
  padding: '12px 16px', borderRadius: 10, marginTop: 16,
  background: kind === 'error' ? 'rgba(192,112,96,0.1)' : 'rgba(94,167,115,0.1)',
  border: `1px solid ${kind === 'error' ? 'rgba(192,112,96,0.3)' : 'rgba(94,167,115,0.3)'}`,
  color: kind === 'error' ? '#c07060' : '#5ea773',
  fontSize: 14, lineHeight: 1.6,
});
