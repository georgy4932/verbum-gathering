import Link from "next/link";
import { getPublishedWorshipSets, getPublishedPractices } from "@/lib/db/worship";

export const metadata = {
  title: "Worship — VerbumScribe",
  description: "The Word embodied. Music, liturgy, silence, and sacred practice.",
};

export const dynamic = "force-dynamic";

export default async function WorshipPage() {
  const [sets, practices] = await Promise.all([
    getPublishedWorshipSets(),
    getPublishedPractices(),
  ]);

  return (
    <main style={{ padding: "0 1.25rem 4rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ padding: "3.5rem 0 2.5rem" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--worship)", display: "block", marginBottom: 14 }}>
            Worship — The Word embodied
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)", marginBottom: 16 }}>
            Truth becomes devotion.
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--stone)", lineHeight: 1.75, maxWidth: 600 }}>
            Music, liturgy, silence, and sacred practice. Every experience anchored in Scripture — not performance, not atmosphere.
          </p>
        </div>

        {/* Worship Sets */}
        {sets.length > 0 ? (
          <div style={{ marginBottom: 48 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold-lo)", display: "block", marginBottom: 20 }}>
              Worship sets
            </span>
            <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {sets.map((s) => (
                <Link
                  key={s.slug}
                  href={`/worship/${s.slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                  className="movement-card worship"
                >
                  <span className="movement-label">{s.kind}</span>
                  <h2 style={{ fontSize: "1.25rem", margin: 0 }}>{s.title}</h2>
                  {s.passage_ref && (
                    <span style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "0.95rem", color: "var(--muted)" }}>
                      {s.passage_ref}
                    </span>
                  )}
                  {s.description && (
                    <p style={{ fontSize: 14, color: "var(--stone)", lineHeight: 1.7, margin: 0 }}>
                      {s.description}
                    </p>
                  )}
                  <span className="enter">Enter →</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Devotional Practices */}
        {practices.length > 0 ? (
          <div style={{ marginBottom: 48 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold-lo)", display: "block", marginBottom: 20 }}>
              Devotional practices
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 16, overflow: "hidden", border: "1px solid var(--faint)" }}>
              {practices.map((p) => (
                <Link
                  key={p.slug}
                  href={`/worship/practices`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    padding: "18px 24px",
                    background: "var(--bg1)",
                    borderBottom: "1px solid var(--faint)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: "1rem", margin: "0 0 2px" }}>{p.title}</h3>
                    {p.passage_ref && (
                      <span style={{ fontSize: 12, color: "var(--worship)", letterSpacing: "0.06em" }}>{p.passage_ref}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--stone)", textTransform: "capitalize" }}>{p.kind}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Empty state */}
        {sets.length === 0 && practices.length === 0 && (
          <div style={{
            padding: "48px 32px",
            textAlign: "center",
            border: "1px solid var(--faint)",
            borderRadius: 16,
            background: "var(--bg1)",
          }}>
            <p style={{
              fontFamily: "'IM Fell English', serif",
              fontStyle: "italic",
              fontSize: "1.1rem",
              color: "var(--muted)",
              lineHeight: 1.85,
              marginBottom: 8,
            }}>
              "Sing to the Lord a new song; sing to the Lord, all the earth."
            </p>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)" }}>
              Psalm 96:1 · Worship experiences coming soon
            </span>
          </div>
        )}

        {/* Link into Today's devotion */}
        <div style={{
          marginTop: 40,
          padding: "24px 28px",
          borderRadius: 16,
          border: "1px solid var(--faint)",
          background: "rgba(155,124,200,0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--worship-lo)", display: "block", marginBottom: 6 }}>
              Daily formation
            </span>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: 0 }}>
              Today's devotion is a quiet entry point into worship and the Word.
            </p>
          </div>
          <Link href="/today" style={{ fontSize: 13, color: "var(--worship)", whiteSpace: "nowrap" }}>
            Open today →
          </Link>
        </div>

      </div>
    </main>
  );
}
