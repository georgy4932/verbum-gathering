'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export async function createGathering(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/signin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('trust_state')
    .eq('id', user.id)
    .single();

  if (profile?.trust_state !== 'trusted_user') {
    redirect('/gatherings/new?error=' + encodeURIComponent('Trusted member status required to create a Gathering'));
  }

  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const visibility = (formData.get('visibility') as string) || 'community';
  const passage_ref = (formData.get('passage_ref') as string)?.trim() || null;

  if (!name || name.length < 3) {
    redirect('/gatherings/new?error=' + encodeURIComponent('Name must be at least 3 characters'));
  }

  if (!['public', 'community', 'private'].includes(visibility)) {
    redirect('/gatherings/new?error=' + encodeURIComponent('Invalid visibility setting'));
  }

  const slug = slugify(name);
  if (!slug) {
    redirect('/gatherings/new?error=' + encodeURIComponent('Name contains no usable characters for a URL'));
  }

  const { error } = await supabase.from('gatherings').insert({
    name,
    slug,
    description,
    visibility,
    passage_ref,
    host_id: user.id,
  });

  if (error) {
    const msg = error.code === '23505'
      ? 'A gathering with that name already exists — try a different name'
      : 'Could not create gathering, please try again';
    redirect('/gatherings/new?error=' + encodeURIComponent(msg));
  }

  redirect(`/gatherings/${slug}`);
}
