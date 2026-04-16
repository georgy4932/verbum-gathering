import Link from "next/link";

export default function GatheringPage() {
  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <p style={{ opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Gathering
        </p>

        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", margin: "12px 0", lineHeight: 1.05 }}>
          Gather together.
        </h1>

        <p style={{ maxWidth: 720, opacity: 0.75, lineHeight: 1.7, marginBottom: 40 }}>
          Prayer, Scripture, and shared presence with others — in real time or quiet spaces.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>

          <Link href="/live" style={cardStyle}>
            <small style={labelStyle}>Live now</small>
            <h2 style={titleStyle}>Join a live gathering</h2>
            <p style={descStyle}>
              Enter a guided space for prayer, worship, or study happening right now.
            </p>
            <span style={ctaStyle}>Enter gathering →</span>
          </Link>

          <Link href="/gathering/studies" style={cardStyle}>
            <small style={labelStyle}>Guided</small>
            <h2 style={titleStyle}>Join a Bible study</h2>
            <p style={descStyle}>
              Follow structured studies led by pastors and teachers. Return regularly and grow deeper in the Word.
            </p>
            <span style={ctaStyle}>View studies →</span>
          </Link>

          <Link href="/rooms" style={cardStyle}>
            <small style={labelStyle}>Open spaces</small>
            <h2 style={titleStyle}>Enter a fellowship space</h2>
            <p style={descStyle}>
              Quiet, ongoing spaces for prayer, testimony, and encouragement. Come and remain as long as you need.
            </p>
            <span style={ctaStyle}>Enter space →</span>
          </Link>

        </div>
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 24,
  background: "rgba(255,255,255,0.03)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  textDecoration: "none",
  color: "inherit",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.6,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  margin: 0,
};

const descStyle: React.CSSProperties = {
  opacity: 0.75,
  fontSize: 14,
  lineHeight: 1.7,
  margin: 0,
};

const ctaStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  opacity: 0.8,
};
