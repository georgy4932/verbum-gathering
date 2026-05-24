import { notFound, redirect } from "next/navigation";
import {
  getGathering,
  getMyMembership,
  listPrayerRequests,
  createPrayerRequest,
  getMyPrayerAcks,
} from "@/app/actions/gatherings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PrayingButton from "@/components/gathering/praying-button";
import type { GatheringPrayerRequest } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export default async function PrayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error: formError } = await searchParams;
  const gathering = await getGathering(slug);
  if (!gathering) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const membership = user ? await getMyMembership(gathering.id) : null;
  const isMember = !!membership;

  const prayerRequests = await listPrayerRequests(gathering.id);
  const myAcks = isMember
    ? await getMyPrayerAcks(prayerRequests.map((r) => r.id))
    : [];

  async function handleCreate(formData: FormData) {
    "use server";
    if (!user) redirect("/auth/signin");
    const res = await createPrayerRequest(gathering!.id, slug, formData);
    if (!res.success) {
      redirect(`/gatherings/${slug}/prayer?error=${encodeURIComponent(res.error)}`);
    }
    redirect(`/gatherings/${slug}/prayer`);
  }

  return (
    <div style={{ display: "grid", gap: 28 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--cream)" }}>Prayer requests</h2>
      </div>

      {/* Request form */}
      {isMember && (
        <section style={sectionStyle}>
          <p style={sectionLabel}>Share a request</p>
          {formError && (
            <p style={{ margin: 0, fontSize: 13, color: "#c07060", lineHeight: 1.5 }}>
              {formError}
            </p>
          )}
          <form action={handleCreate} style={{ display: "grid", gap: 14 }}>
            <textarea
              name="body"
              required
              rows={3}
              placeholder="What would you like prayer for?"
              style={textareaStyle}
            />
            <button type="submit" style={submitStyle}>Share quietly</button>
          </form>
        </section>
      )}

      {/* Requests list */}
      {prayerRequests.length === 0 ? (
        <div style={emptyStyle}>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            No prayer requests yet.{isMember ? " Share what is on your heart." : ""}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {prayerRequests.map((req: GatheringPrayerRequest) => (
            <article key={req.id} style={cardStyle}>
              <p style={{ margin: 0, color: "var(--cream)", fontSize: 15, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {req.body}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <p style={{ margin: 0, color: "var(--stone)", fontSize: 11, opacity: 0.5 }}>
                  {new Date(req.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {isMember && (
                  <PrayingButton
                    requestId={req.id}
                    gatheringSlug={slug}
                    initialCount={req.praying_count}
                    initialPraying={myAcks.includes(req.id)}
                  />
                )}
                {!isMember && req.praying_count > 0 && (
                  <span style={{ fontSize: 12, color: "var(--stone)", opacity: 0.5 }}>
                    {req.praying_count} praying
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: "20px 24px", borderRadius: 20,
  border: "1px solid var(--faint)", background: "var(--card-surface)",
  display: "grid", gap: 14,
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", margin: 0,
};
const textareaStyle: React.CSSProperties = {
  borderRadius: 12, border: "1px solid var(--faint2)", background: "var(--bg2)",
  color: "var(--cream)", padding: "0.75rem 1rem", fontSize: 14,
  fontFamily: "'DM Sans', sans-serif", outline: "none",
  caretColor: "var(--companion)", width: "100%", boxSizing: "border-box",
  resize: "vertical", lineHeight: 1.75,
};
const submitStyle: React.CSSProperties = {
  minHeight: 40, padding: "0 1.2rem", borderRadius: 999,
  border: "1px solid var(--faint2)", background: "transparent",
  color: "var(--muted)", fontSize: 13, cursor: "pointer",
  justifySelf: "start",
};
const emptyStyle: React.CSSProperties = {
  padding: "28px 24px", borderRadius: 20,
  border: "1px solid var(--faint)", background: "var(--card-surface)",
};
const cardStyle: React.CSSProperties = {
  padding: "18px 22px", borderRadius: 18,
  border: "1px solid var(--faint)", background: "var(--card-surface)",
  display: "grid", gap: 14,
};
