import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "VerbumScribe",
  description: "The Word, with you. A quiet place for Scripture, prayer, teaching, and worship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
