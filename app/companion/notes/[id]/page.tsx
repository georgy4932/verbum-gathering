import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getStudyNote } from '@/app/actions/study-notes';
import { NoteEditorClient } from '@/components/companion/note-editor-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getStudyNote(id);
  return {
    title: note?.title ? `${note.title} — Notes` : 'Study Note — Companion',
  };
}

export default async function NoteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/signin');

  const note = await getStudyNote(id);
  if (!note) notFound();

  return (
    // Full-page writing surface — minimal chrome
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <NoteEditorClient note={note} />
    </div>
  );
}
