'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function OnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (!user) { router.push('/auth/signin'); return; }
      setUserId(user.id);

      // Pre-fill if Google metadata has a name
      const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
      if (googleName) setDisplayName(googleName);
    }
    load();
  }, [router]);

  async function saveProfile() {
    const trimmed = displayName.trim();
    if (!trimmed || !userId) return;
    setSaving(true);
    setNotice('');

    const { error } = await supabaseBrowser.from('profiles').upsert({
      id: userId,
      display_name: trimmed,
    }, { onConflict: 'id' });

    setSaving(false);

    if (error) {
      setNotice('Unable to save your profile. Please try again.');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <main style={{ padding: '4rem 1.25rem 6rem' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.4em',
          textTransform: 'uppercase', color: 'var(--gold-lo)', marginBottom: 14,
        }}>
          Welcome
        </p>
        <h1 style={{
          fontFamily: "'IM Fell English', serif",
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          lineHeight: 1.05, margin: '0 0 12px', color: 'var(--cream)',
        }}>
          What shall we call you?
        </h1>
        <p style={{ fontSize: 15, color: 'var(--stone)', lineHeight: 1.75, marginBottom: 28 }}>
          Set a display name that others will see in the gathering.
          You can update it anytime in your profile settings.
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveProfile()}
            placeholder="Grace Walker"
            maxLength={60}
            style={{
              minHeight: 46, borderRadius: 10,
              border: '1px solid var(--faint)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--cream)', padding: '0 14px',
              fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none',
            }}
          />

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving || displayName.trim().length < 1}
            style={{
              minHeight: 46, borderRadius: 999, border: 'none',
              background: 'var(--gold)', color: 'var(--bg)',
              fontSize: 14, fontWeight: 700, letterSpacing: '0.05em',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>

          {notice && (
            <p style={{ fontSize: 14, color: '#c07060', margin: 0, lineHeight: 1.6 }}>{notice}</p>
          )}
        </div>
      </div>
    </main>
  );
}
