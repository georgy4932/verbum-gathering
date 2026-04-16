import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verbum Gathering",
  description: "A place for daily devotion, fellowship, Bible study, and worship.",
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
              Verbum Gathering
            </Link>
           <nav className="nav-links">
  <Link href="/gathering">Gathering</Link>
  <Link href="/today">Today</Link>
  <Link href="/rooms">Rooms</Link>
</nav>

          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
