import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Studio — VerbumScribe",
  description: "Teachings and devotions rooted in Scripture. The Word proclaimed.",
};

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const { data: teachings } = await supabase
    .from("teachings")
    .select("slug, title, passage_ref, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(6);

  const { data: series } = await supabase
    .from("teaching_series")
    .select("slug, title, description")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main style={{ padding: "0 1.25rem 4rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div className="page-header">
          <span className="movement-eyebrow" style={{ color: "var(--studio)" }}>
            Studio — The Word proclaimed
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)" }}>
            From receiving truth to sharing it.
          </h1>
          <p className="subtitle">
            Teachings, sermons, and devotions rooted in Scripture.
            Every message anchored to a passage — not a platform or a personality.
          </p>
        </div>

        {/* Teaching Series */}
        {series && series.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
              <span className="eyebrow" style={{ margin: 0 }}>Series</span>
            </div>
            <div className="card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {series.map((s) => (
                <Link
                  key={s.slug}
                  href={`/studio/series/${s.slug}`}
                  className="movement-card studio"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <span className="movement-label">Series</span>
                  <h2 style={{ fontSize: "1.25rem", margin: 0 }}>{s.title}</h2>
                  {s.description && (
                    <p style={{ fontSize: 14, color: "var(--stone)", lineHeight: 1.7, margin: 0 }}>
                      {s.description}
                    </p>
                  )}
                  <span className="enter">Open series →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Teachings */}
        {teachings && teachings.length > 0 ? (
          <div>
            <span className="eyebrow">Recent teachings</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 16, overflow: "hidden", border: "1px solid var(--faint)" }}>
              {teachings.map((t) => (
                <Link
                  key={t.slug}
                  href={`/studio/${t.slug}`}
                  style={{
                    display: "flex", flexDirection: "column", gap: 6,
                    padding: "20px 24px",
                    background: "var(--bg1)",
                    textDecoration: "none", color: "inherit",
                    borderBottom: "1px solid var(--faint)",
                    transition: "background 0.2s",
                  }}
                >
                  <h3 style={{ fontSize: "1.05rem", margin: 0, fontFamily: "'IM Fell English', serif" }}>
                    {t.title}
                  </h3>
                  {t.passage_ref && (
                    <span style={{ fontSize: 12, color: "var(--gold-lo)", letterSpacing: "0.1em" }}>
                      {t.passage_ref}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            padding: "48px 32px", textAlign: "center",
            border: "1px solid var(--faint)", borderRadius: 16,
            background: "var(--bg1)",
          }}>
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.85, marginBottom: 8 }}>
              "How beautiful are the feet of those who bring good news."
            </p>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)" }}>
              Romans 10:15 · Teachings coming soon
            </span>
          </div>
        )}

      </div>
    </main>
  );
}
