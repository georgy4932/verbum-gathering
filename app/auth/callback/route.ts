import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (list: { name: string; value: string; options: Record<string, unknown> }[]) =>
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    );

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    if (session) {
      // For OAuth sign-ins, ensure a profile row exists with whatever
      // display name Google provided. The DB trigger handles this but
      // the profile may not have a display_name if it wasn't in metadata.
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .maybeSingle();

      // If the user has no display_name yet, send to onboarding.
      if (!profile?.display_name) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
      }

      // Honour the `next` param (e.g. password-reset flow).
      const safePath = next.startsWith('/') ? next : '/';
      return NextResponse.redirect(new URL(safePath, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin));
}
