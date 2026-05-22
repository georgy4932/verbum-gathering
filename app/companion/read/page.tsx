import Link from "next/link";
import { OLD_TESTAMENT, NEW_TESTAMENT } from "@/lib/bible/books";

export const metadata = {
  title: "Open Scripture — Companion",
};

export default function CompanionReadPage() {
  return (
    <main style={{ padding: "0 1.25rem 5rem" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        <div style={{ padding: "3rem 0 2.5rem" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--companion)", display: "block", marginBottom: 14 }}>
            Companion — Open Scripture
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", marginBottom: 14 }}>
            Choose a book.
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--stone)", lineHeight: 1.75, maxWidth: 520 }}>
            Open any passage. Read slowly. The text is the primary voice — the companion only serves it.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold-lo)", display: "block", marginBottom: 20 }}>
              Old Testament
            </span>
            <div style={bookGridStyle}>
              {OLD_TESTAMENT.map((book) => (
                <Link
                  key={book.slug}
                  href={`/companion/read/${book.slug}/1`}
                  style={bookLinkStyle}
                >
                  {book.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold-lo)", display: "block", marginBottom: 20 }}>
              New Testament
            </span>
            <div style={bookGridStyle}>
              {NEW_TESTAMENT.map((book) => (
                <Link
                  key={book.slug}
                  href={`/companion/read/${book.slug}/1`}
                  style={bookLinkStyle}
                >
                  {book.name}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

const bookGridStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const bookLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--muted)",
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--faint)",
  background: "var(--bg1)",
  textDecoration: "none",
  letterSpacing: "0.02em",
  transition: "border-color 0.2s, color 0.2s",
};
