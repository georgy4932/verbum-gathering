import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/profile";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "VerbumScribe",
  description: "The Word, with you. A quiet place for Scripture, prayer, teaching, and worship.",
};

// Runs synchronously before body paint — prevents flash of wrong theme.
const themeScript = `(function(){try{var p=localStorage.getItem('verbum-theme')||'system';var r=p==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;document.documentElement.setAttribute('data-theme',r);document.documentElement.setAttribute('data-theme-pref',p);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile } = await getCurrentUserProfile();

  const initials = profile?.display_name
    ? profile.display_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <html lang="en">
      {/* Anti-FOUC: set data-theme before first paint */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <header className="site-header">
          <div className="container nav">
            <Link href="/" className="brand">
              VerbumScribe
            </Link>
            <nav className="nav-links" aria-label="Primary navigation">
              <Link href="/companion">Companion</Link>
              <Link href="/gathering">Gathering</Link>
              <Link href="/studio">Studio</Link>
              <Link href="/worship">Worship</Link>
              <span className="nav-divider" aria-hidden="true" />
              <Link href="/today">Today</Link>
              <span className="nav-divider" aria-hidden="true" />
              <ThemeToggle />
              {user ? (
                <Link
                  href="/settings/profile"
                  aria-label="Profile settings"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    border: '1px solid var(--gold-lo)',
                    background: 'rgba(200,169,106,0.1)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--gold)',
                      letterSpacing: '0.02em', lineHeight: 1,
                    }}>
                      {initials}
                    </span>
                  )}
                </Link>
              ) : (
                <Link href="/auth/signin" style={{ fontSize: 13, fontWeight: 500, color: 'var(--stone)', letterSpacing: '0.06em' }}>
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
