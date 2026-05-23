import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createStudyNote } from '@/app/actions/study-notes';

export const dynamic = 'force-dynamic';

// Visited via <Link href="/companion/notes/new"> — creates a note and
// immediately redirects to the editor. Works without client-side JS.
export default async function NewNotePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/signin');

  const today = new Date().toISOString().split('T')[0];
  const result = await createStudyNote({ note_date: today });

  if (!result.success || !result.data) redirect('/companion/notes');
  redirect(`/companion/notes/${result.data.id}`);
}
