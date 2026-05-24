import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NoteEditorClient } from '@/components/companion/note-editor-client';

export const metadata = {
  title: 'New Note — Companion',
};

export const dynamic = 'force-dynamic';

// Renders the editor in draft mode (note=null).
// The DB row is created only when the user types substantive content.
// Accepts ?passage_ref=... to pre-fill the passage field when arriving
// from the saved-passages screen.
export default async function NewNotePage({
  searchParams,
}: {
  searchParams: Promise<{ passage_ref?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/signin');

  const { passage_ref } = await searchParams;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <NoteEditorClient note={null} initialPassageRef={passage_ref} />
    </div>
  );
}
