import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTeachingBySlug, getTeachingBySlugForEdit } from "@/lib/db/studio";
import ScriptureBlock from "@/components/shared/scripture-block";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  sermon:   "Sermon",
  devotion: "Devotion",
  study:    "Study",
  lecture:  "Lecture",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const teaching = await getTeachingBySlug(slug);
  if (!teaching) return { title: "Studio" };
  return { title: `${teaching.title} — Studio` };
}

export default async function TeachingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If the viewer is the minister, allow them to see their own drafts
  let teaching = await getTeachingBySlug(slug);
  if (!teaching && user) {
    teaching = await getTeachingBySlugForEdit(slug, user.id);
  }
  if (!teaching) notFound();

  const isOwner = user?.id === teaching.minister_id;
  const paragraphs = (teaching.body ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <main style={{ padding: "0 1.25rem 5rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Breadcrumb */}
        <div style={{ padding: "2rem 0 2.5rem", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Link href="/studio" style={{ fontSize: 12, color: "var(--stone)" }}>Studio</Link>
          {teaching.series && (
            <>
              <span style={{ color: "var(--faint2)" }}>›</span>
              <Link href={`/studio/series/${teaching.series.slug}`} style={{ fontSize: 12, color: "var(--stone)" }}>
                {teaching.series.title}
              </Link>
            </>
          )}
          <span style={{ color: "var(--faint2)" }}>›</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{teaching.title}</span>
        </div>

        {/* Kind + draft badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase",
            color: "var(--studio)",
          }}>
            {KIND_LABEL[teaching.kind] ?? teaching.kind}
          </span>
          {!teaching.is_published && (
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--bg)", background: "var(--stone)", borderRadius: 4, padding: "2px 7px",
            }}>
              Draft
            </span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "'IM Fell English', serif", fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.05, marginBottom: 20 }}>
          {teaching.title}
        </h1>

        {/* Primary passage — always prominent */}
        {teaching.passage_ref && (
          <p style={{
            fontFamily: "'IM Fell English', serif",
            fontStyle: "italic",
            fontSize: "1.1rem",
            color: "var(--gold)",
            marginBottom: 32,
            letterSpacing: "0.04em",
          }}>
            {teaching.passage_ref}
          </p>
        )}

        {/* Additional Scripture references */}
        {teaching.scripture_refs.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
            {teaching.scripture_refs.map((ref) => (
              <Link
                key={ref}
                href={`/companion/read/${refToRoute(ref)}`}
                style={{
                  fontSize: 11, color: "var(--gold-lo)", letterSpacing: "0.12em",
                  border: "1px solid var(--studio-lo)", borderRadius: 6,
                  padding: "4px 10px", textDecoration: "none",
                  fontFamily: "'IM Fell English', serif",
                }}
              >
                {ref}
              </Link>
            ))}
          </div>
        )}

        {/* Body */}
        {paragraphs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 22, marginBottom: 48 }}>
            {paragraphs.map((p, i) => (
              <p key={i} style={{ fontSize: "1.05rem", lineHeight: 1.85, color: "var(--muted)", margin: 0 }}>
                {p}
              </p>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 48 }}>
            {teaching.passage_ref && (
              <ScriptureBlock reference={teaching.passage_ref} text="Open this passage in Companion to study it." size="md" />
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          borderTop: "1px solid var(--faint)", paddingTop: 28,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {teaching.passage_ref && (
              <Link
                href={`/companion/read/${refToRoute(teaching.passage_ref)}`}
                style={{ fontSize: 12, color: "var(--companion)" }}
              >
                Read {teaching.passage_ref} in Companion →
              </Link>
            )}
          </div>
          {isOwner && (
            <Link href={`/studio/${teaching.slug}/edit`} style={{ fontSize: 12, color: "var(--stone)" }}>
              Edit teaching
            </Link>
          )}
        </div>

      </div>
    </main>
  );
}

// Best-effort: "John 3:16" → "john/3", "Romans 8" → "romans/8"
function refToRoute(ref: string): string {
  const clean = ref.replace(/:\d+.*$/, "").trim();
  const parts = clean.split(" ");
  const chapter = parseInt(parts[parts.length - 1], 10);
  if (!isNaN(chapter)) {
    const bookName = parts.slice(0, -1).join(" ");
    return `${bookName.toLowerCase().replace(/\s+/g, "-")}/${chapter}`;
  }
  return clean.toLowerCase().replace(/\s+/g, "-") + "/1";
}
