import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/profile';
import { getSavedPassagesByUser } from '@/lib/db/companion';
import { SavedPassagesClient } from '@/components/companion/saved-passages-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Saved Passages — Companion',
};

export default async function CompanionSavedPage() {
  const { user } = await getCurrentUserProfile();
  if (!user) redirect('/sign-in');

  const saved = await getSavedPassagesByUser(user.id);

  return (
    <main style={{ padding: '0 1.25rem 5rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div style={{ padding: '3rem 0 2.5rem' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.4em',
            textTransform: 'uppercase', color: 'var(--companion)',
            display: 'block', marginBottom: 14,
          }}>
            Companion — Saved Passages
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: 14 }}>
            Passages you have returned to.
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--stone)', lineHeight: 1.75 }}>
            A quiet library, built through reading — not curation.
          </p>
        </div>

        <SavedPassagesClient initialPassages={saved} />

      </div>
    </main>
  );
}
