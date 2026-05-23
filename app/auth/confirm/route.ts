// Handles token_hash-based verification (non-PKCE path).
//
// This route is NOT used by the standard signup flow. Email confirmation
// after signUp() uses emailRedirectTo → /auth/callback (PKCE code exchange).
//
// This route is available as a fallback if Supabase email templates are
// manually configured to use token_hash links (type=email or type=recovery).
// To activate it, set the Confirmation URL template in Supabase dashboard to:
//   https://your-domain.com/auth/confirm?token_hash={{ .TokenHash }}&type=email
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'email' | 'recovery' | null;

  if (token_hash && type) {
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

    const { error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      return NextResponse.redirect(`${origin}/auth/signin?confirmed=1`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/signin?error=confirm_failed`);
}
