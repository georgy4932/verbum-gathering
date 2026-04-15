import Link from "next/link";

type ContinueFromHereProps = {
  currentRoomSlug: string;
  nextGathering?: {
    slug: string;
    title: string;
    timeLabel?: string | null;
  } | null;
};

export default function ContinueFromHere({
  currentRoomSlug,
  nextGathering,
}: ContinueFromHereProps) {
  return (
    <div
      style={{
        marginTop: 36,
        padding: 24,
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.015)",
      }}
    >
      <p style={{ opacity: 0.58, margin: "0 0 8px", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.82rem" }}>
        Continue from here
      </p>

      <h3 style={{ marginTop: 0, marginBottom: 10, letterSpacing: "-0.02em" }}>
        Carry this with you.
      </h3>

      <p style={{ opacity: 0.78, lineHeight: 1.7, marginTop: 0, marginBottom: 20 }}>
        Stay with the Word, return to prayer, or enter another gathering when the time is right.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <Link href="/today" style={{ display: "block", padding: 18, borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", textDecoration: "none" }}>
          <p style={{ opacity: 0.58, margin: "0 0 6px", fontSize: "0.85rem", letterSpacing: "0.1em" }}>Today</p>
          <p style={{ margin: 0 }}>Return to today's devotion</p>
        </Link>

        <Link href="/rooms" style={{ display: "block", padding: 18, borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", textDecoration: "none" }}>
          <p style={{ opacity: 0.58, margin: "0 0 6px", fontSize: "0.85rem", letterSpacing: "0.1em" }}>Fellowship</p>
          <p style={{ margin: 0 }}>Enter a fellowship space</p>
        </Link>

        {nextGathering ? (
          <Link href={`/live/${nextGathering.slug}`} style={{ display: "block", padding: 18, borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", textDecoration: "none" }}>
            <p style={{ opacity: 0.58, margin: "0 0 6px", fontSize: "0.85rem", letterSpacing: "0.1em" }}>Next gathering</p>
            <p style={{ margin: "0 0 6px" }}>{nextGathering.title}</p>
            {nextGathering.timeLabel ? (
              <p style={{ opacity: 0.72, margin: 0 }}>{nextGathering.timeLabel}</p>
            ) : null}
          </Link>
        ) : (
          <Link href="/live" style={{ display: "block", padding: 18, borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", textDecoration: "none" }}>
            <p style={{ opacity: 0.58, margin: "0 0 6px", fontSize: "0.85rem", letterSpacing: "0.1em" }}>Gatherings</p>
            <p style={{ margin: 0 }}>See upcoming gatherings</p>
          </Link>
        )}
      </div>
    </div>
  );
}
