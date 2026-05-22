import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeriesBySlug } from "@/lib/db/studio";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return { title: "Studio" };
  return { title: `${series.title} — Studio` };
}

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) notFound();

  return (
    <main style={{ padding: "0 1.25rem 5rem" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        <div style={{ padding: "2rem 0 2.5rem", display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/studio" style={{ fontSize: 12, color: "var(--stone)" }}>Studio</Link>
          <span style={{ color: "var(--faint2)" }}>›</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{series.title}</span>
        </div>

        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--studio)", display: "block", marginBottom: 14 }}>
          Series
        </span>
        <h1 style={{ fontFamily: "'IM Fell English', serif", fontSize: "clamp(2rem, 5vw, 3.2rem)", marginBottom: 16 }}>
          {series.title}
        </h1>
        {series.description && (
          <p style={{ fontSize: "1rem", color: "var(--stone)", lineHeight: 1.75, maxWidth: 600, marginBottom: 40 }}>
            {series.description}
          </p>
        )}

        {series.teachings.length === 0 ? (
          <div style={{
            padding: "40px 32px", textAlign: "center",
            border: "1px solid var(--faint)", borderRadius: 14, background: "var(--bg1)",
          }}>
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "1rem", color: "var(--muted)" }}>
              No teachings published in this series yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 14, overflow: "hidden", border: "1px solid var(--faint)" }}>
            {series.teachings.map((t, i) => (
              <Link
                key={t.slug}
                href={`/studio/${t.slug}`}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "20px 24px",
                  background: "var(--bg1)",
                  borderBottom: "1px solid var(--faint)",
                  textDecoration: "none", color: "inherit",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--stone)", minWidth: 24, textAlign: "right" }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1rem", margin: "0 0 4px", fontFamily: "'IM Fell English', serif" }}>
                    {t.title}
                  </h3>
                  {t.passage_ref && (
                    <span style={{ fontSize: 11, color: "var(--gold-lo)", letterSpacing: "0.1em" }}>
                      {t.passage_ref}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: "var(--stone)" }}>→</span>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
