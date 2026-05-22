import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorshipSetBySlug } from "@/lib/db/worship";
import ScriptureBlock from "@/components/shared/scripture-block";
import type { WorshipMomentKind } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<WorshipMomentKind, string> = {
  song:       "Song",
  reading:    "Scripture reading",
  prayer:     "Prayer",
  silence:    "Silence",
  reflection: "Reflection",
};

const KIND_COLOR: Record<WorshipMomentKind, string> = {
  song:       "var(--worship)",
  reading:    "var(--companion)",
  prayer:     "var(--gold)",
  silence:    "var(--stone)",
  reflection: "var(--gathering)",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const set = await getWorshipSetBySlug(slug);
  if (!set) return { title: "Worship" };
  return { title: `${set.title} — Worship` };
}

export default async function WorshipSetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const set = await getWorshipSetBySlug(slug);
  if (!set) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === set.curator_id;

  return (
    <main style={{ padding: "0 1.25rem 5rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Breadcrumb */}
        <div style={{ padding: "2rem 0 2.5rem", display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/worship" style={{ fontSize: 12, color: "var(--stone)" }}>Worship</Link>
          <span style={{ color: "var(--faint2)" }}>›</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{set.title}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--worship)", display: "block", marginBottom: 12 }}>
            {set.kind.charAt(0).toUpperCase() + set.kind.slice(1)} worship set
          </span>
          <h1 style={{ fontFamily: "'IM Fell English', serif", fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1.05, marginBottom: 16 }}>
            {set.title}
          </h1>
          {set.description && (
            <p style={{ fontSize: "1rem", color: "var(--stone)", lineHeight: 1.75, maxWidth: 560, marginBottom: 20 }}>
              {set.description}
            </p>
          )}

          {/* Anchor Scripture */}
          {set.passage_ref && (
            <div style={{ marginBottom: 20 }}>
              <ScriptureBlock
                reference={set.passage_ref}
                text={set.description ?? "This worship set is anchored in this passage."}
                size="sm"
              />
            </div>
          )}

          {/* Additional refs */}
          {set.scripture_refs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {set.scripture_refs.map((ref) => (
                <span key={ref} style={{
                  fontSize: 11, color: "var(--worship)", letterSpacing: "0.1em",
                  border: "1px solid var(--worship-lo)", borderRadius: 6,
                  padding: "3px 10px", fontFamily: "'IM Fell English', serif",
                }}>
                  {ref}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Moments */}
        {set.moments.length === 0 ? (
          <div style={{
            padding: "40px 32px", textAlign: "center",
            border: "1px solid var(--faint)", borderRadius: 14, background: "var(--bg1)",
          }}>
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "1rem", color: "var(--muted)" }}>
              This worship set has no moments yet.
            </p>
            {isOwner && (
              <Link href={`/worship/${slug}/edit`} style={{ fontSize: 12, color: "var(--worship)", marginTop: 16, display: "inline-block" }}>
                Add moments →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {set.moments.map((moment, i) => (
              <div
                key={moment.id}
                style={{
                  padding: "28px 0",
                  borderBottom: i < set.moments.length - 1 ? "1px solid var(--faint)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "var(--stone)" }}>{i + 1}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: KIND_COLOR[moment.kind] }}>
                    {KIND_LABEL[moment.kind]}
                  </span>
                  {moment.passage_ref && (
                    <span style={{ fontSize: 12, color: "var(--gold-lo)", fontFamily: "'IM Fell English', serif" }}>
                      {moment.passage_ref}
                    </span>
                  )}
                </div>

                {moment.title && (
                  <h2 style={{ fontFamily: "'IM Fell English', serif", fontSize: "1.4rem", margin: "0 0 12px", lineHeight: 1.2 }}>
                    {moment.title}
                  </h2>
                )}

                {moment.kind === "silence" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "var(--faint)" }} />
                    <span style={{ fontSize: 12, color: "var(--stone)", letterSpacing: "0.15em" }}>
                      {moment.duration_seconds
                        ? `${Math.floor(moment.duration_seconds / 60)} min silence`
                        : "A time of silence"}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "var(--faint)" }} />
                  </div>
                ) : moment.kind === "reading" && moment.passage_ref ? (
                  <ScriptureBlock
                    reference={moment.passage_ref}
                    text={moment.body ?? ""}
                    size="md"
                  />
                ) : moment.body ? (
                  <p style={{
                    fontSize: "1.05rem",
                    fontFamily: moment.kind === "prayer" ? "'IM Fell English', serif" : "inherit",
                    fontStyle: moment.kind === "prayer" ? "italic" : "normal",
                    color: "var(--muted)",
                    lineHeight: 1.85,
                    margin: 0,
                    maxWidth: 620,
                  }}>
                    {moment.body}
                  </p>
                ) : null}

                {moment.media_url && (
                  <a
                    href={moment.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "var(--worship)", marginTop: 10, display: "inline-block" }}
                  >
                    Listen →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--faint)", paddingTop: 28, marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/worship" style={{ fontSize: 12, color: "var(--stone)" }}>← All worship sets</Link>
          {isOwner && (
            <Link href={`/worship/${slug}/edit`} style={{ fontSize: 12, color: "var(--stone)" }}>
              Edit set
            </Link>
          )}
        </div>

      </div>
    </main>
  );
}
