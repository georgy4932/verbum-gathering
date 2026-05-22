import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "Studio — VerbumScribe",
  description: "Teachings and devotions rooted in Scripture. The Word proclaimed.",
};

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const [{ data: teachings }, { data: series }] = await Promise.all([
    supabase
      .from("teachings")
      .select("slug, title, passage_ref, kind, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(10),
    supabase
      .from("teaching_series")
      .select("slug, title, description")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  // Role check for minister actions — separate server client reads session cookie
  const serverSupabase = await createSupabaseServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  let isMinister = false;
  if (user) {
    const { data: roleRow } = await serverSupabase
      .from("user_roles").select("role").eq("id", user.id).maybeSingle();
    const role = roleRow?.role ?? "member";
    isMinister = ["minister", "admin"].includes(role);
  }

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
          {isMinister && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
              <Link href="/studio/new" className="button primary">
                + New teaching
              </Link>
              <Link href="/studio/series/new" className="button secondary">
                + New series
              </Link>
            </div>
          )}
        </div>

        {/* Teaching Series */}
        {series && series.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <span className="eyebrow">Series</span>
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
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "20px 24px",
                    background: "var(--bg1)",
                    textDecoration: "none", color: "inherit",
                    borderBottom: "1px solid var(--faint)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1.05rem", margin: "0 0 4px", fontFamily: "'IM Fell English', serif" }}>
                      {t.title}
                    </h3>
                    {t.passage_ref && (
                      <span style={{ fontSize: 12, color: "var(--gold-lo)", letterSpacing: "0.1em" }}>
                        {t.passage_ref}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: "var(--stone)", textTransform: "capitalize", letterSpacing: "0.1em" }}>
                    {t.kind}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            padding: "48px 32px", textAlign: "center",
            border: "1px solid var(--faint)", borderRadius: 16, background: "var(--bg1)",
          }}>
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "1.1rem", color: "var(--muted)", lineHeight: 1.85, marginBottom: 8 }}>
              "How beautiful are the feet of those who bring good news."
            </p>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", display: "block", marginBottom: isMinister ? 20 : 0 }}>
              Romans 10:15 · Teachings coming soon
            </span>
            {isMinister && (
              <Link href="/studio/new" style={{ fontSize: 13, color: "var(--studio)" }}>
                Write the first teaching →
              </Link>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
