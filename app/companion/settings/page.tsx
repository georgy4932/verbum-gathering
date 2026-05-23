import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getNotificationPreferences } from '@/app/actions/notifications';
import { NotificationSettings } from '@/components/companion/notification-settings';

export const metadata = {
  title: 'Settings — Companion',
  description: 'Manage your reading reminders and preferences.',
};

export const dynamic = 'force-dynamic';

export default async function CompanionSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/signin');

  const prefs = await getNotificationPreferences();

  return (
    <main style={{ padding: '0 1.25rem 4rem' }}>
      <div style={{ maxWidth: 540, margin: '0 auto' }}>

        <div className="page-header" style={{ marginBottom: 40 }}>
          <Link
            href="/companion"
            style={{ fontSize: 12, color: 'var(--stone)', textDecoration: 'none', opacity: 0.7, display: 'block', marginBottom: 16 }}
          >
            ← Back to Companion
          </Link>
          <span className="movement-eyebrow" style={{ color: 'var(--companion)' }}>
            Companion — Settings
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 8 }}>
            Reminders
          </h1>
          <p style={{ color: 'var(--stone)', fontSize: 14, lineHeight: 1.75, margin: 0, maxWidth: 400 }}>
            One quiet nudge when your reading for the day is still open.
            No repeated messages. No pressure. Turn it off anytime.
          </p>
        </div>

        <NotificationSettings initialPrefs={prefs} />

        <div style={{ borderTop: '1px solid var(--faint)', marginTop: 48, paddingTop: 24 }}>
          <p style={{
            fontSize: 12, color: 'var(--stone)', lineHeight: 1.7, opacity: 0.6,
          }}>
            Reminders appear here in the app when you have an active reading plan and your preferred
            time has passed. No emails. No push notifications — yet.
          </p>
        </div>

      </div>
    </main>
  );
}
