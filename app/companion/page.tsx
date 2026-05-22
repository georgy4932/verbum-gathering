import Link from "next/link";

export const metadata = {
  title: "Companion — VerbumScribe",
  description: "Read Scripture. Reflect. Study with an AI companion that serves the text.",
};

export default function CompanionPage() {
  return (
    <main style={{ padding: "0 1.25rem 4rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div className="page-header">
          <span className="movement-eyebrow" style={{ color: "var(--companion)" }}>
            Companion — The Word interpreted
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)" }}>
            The Word, open before you.
          </h1>
          <p className="subtitle">
            Read Scripture. Reflect on what you find. Ask questions. Study with an AI companion
            that serves the text — and never replaces it.
          </p>
        </div>

        <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginBottom: 40 }}>

          <Link href="/companion/read" style={cardStyle} className="movement-card companion">
            <span className="movement-label">Scripture</span>
            <h2 style={titleStyle}>Read a passage</h2>
            <p style={descStyle}>
              Open any book of the Bible. Read with the text as the primary voice.
              Reflect and annotate quietly as you go.
            </p>
            <span className="enter">Open Scripture →</span>
          </Link>

          <Link href="/companion/notes" style={cardStyle} className="movement-card companion">
            <span className="movement-label">Notes</span>
            <h2 style={titleStyle}>My study notes</h2>
            <p style={descStyle}>
              Your private notes, anchored to passages. Not a social feed.
              A personal record of formation.
            </p>
            <span className="enter">Open notes →</span>
          </Link>

          <Link href="/companion/saved" style={cardStyle} className="movement-card companion">
            <span className="movement-label">Saved</span>
            <h2 style={titleStyle}>Saved passages</h2>
            <p style={descStyle}>
              Passages you have marked to return to. Your Scripture library,
              built through reading — not curation.
            </p>
            <span className="enter">Open library →</span>
          </Link>

        </div>

        {/* Doctrine reminder — visible in the UI as formation posture */}
        <div style={{
          borderTop: "1px solid var(--faint)",
          paddingTop: 32,
          maxWidth: 640,
        }}>
          <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.85 }}>
            "Your word is a lamp to my feet and a light to my path."
          </p>
          <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginTop: 10, display: "block" }}>
            Psalm 119:105
          </span>
        </div>

      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  margin: 0,
};

const descStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.75,
  margin: 0,
};
