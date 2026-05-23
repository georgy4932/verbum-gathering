import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getRecentStudyNotes } from '@/app/actions/study-notes';
import { NotesListClient } from '@/components/companion/notes-list-client';

export const metadata = {
  title: 'Study Notes — Companion',
  description: 'Your private Scripture study journal.',
};

export const dynamic = 'force-dynamic';

export default async function CompanionNotesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/signin');

  const notes = await getRecentStudyNotes(50);

  return (
    <main style={{ padding: '0 1.25rem 4rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div className="page-header">
          <span className="movement-eyebrow" style={{ color: 'var(--companion)' }}>
            Companion — Study Notes
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: 12 }}>
            Your study journal.
          </h1>
          <p className="subtitle">
            Private notes anchored to Scripture. Longer than a reflection, open-ended,
            and yours alone.
          </p>
        </div>

        <NotesListClient initialNotes={notes} />

        <div style={{ borderTop: '1px solid var(--faint)', marginTop: 56, paddingTop: 28 }}>
          <p style={{ fontSize: 12, color: 'var(--stone)', lineHeight: 1.7, maxWidth: 480, opacity: 0.65 }}>
            Study notes differ from reflections. Reflections are brief and tied to a reading day.
            Notes are open-ended — for study, for sermons, for personal formation.
          </p>
          <Link
            href="/companion"
            style={{ display: 'inline-block', marginTop: 14, fontSize: 12, color: 'var(--stone)', opacity: 0.5 }}
          >
            ← Back to Companion
          </Link>
        </div>

      </div>
    </main>
  );
}
