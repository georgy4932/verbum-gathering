import { notFound, redirect } from "next/navigation";
import {
  getGathering,
  getMyMembership,
  listLiveSessions,
  createLiveSession,
} from "@/app/actions/gatherings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GatheringLiveSession } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export default async function LivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gathering = await getGathering(slug);
  if (!gathering) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const membership = user ? await getMyMembership(gathering.id) : null;
  const isMod = membership?.role === "host" || membership?.role === "moderator";

  const sessions = await listLiveSessions(gathering.id);
  const now = new Date();
  const upcoming = sessions.filter((s) => new Date(s.starts_at) > now);
  const past = sessions.filter((s) => new Date(s.starts_at) <= now);

  async function handleCreate(formData: FormData) {
    "use server";
    if (!user) redirect("/auth/signin");
    await createLiveSession(gathering!.id, slug, formData);
    redirect(`/gatherings/${slug}/live`);
  }

  return (
    <div style={{ display: "grid", gap: 32 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--cream)" }}>Live sessions</h2>
      </div>

      {/* Schedule form — host/mod only */}
      {isMod && (
        <section style={sectionStyle}>
          <p style={sectionLabel}>Schedule a session</p>
          <form action={handleCreate} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={sectionLabel}>Title *</label>
              <input name="title" required placeholder="e.g. Sunday teaching" style={inputStyle} />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={sectionLabel}>Description (optional)</label>
              <textarea name="description" rows={2} placeholder="What will this session cover?" style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={sectionLabel}>Start time *</label>
              <input name="starts_at" type="datetime-local" required style={inputStyle} />
            </div>
            <button type="submit" style={submitStyle}>Schedule session</button>
          </form>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <p style={sectionLabel}>Upcoming</p>
          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            {upcoming.map((s: GatheringLiveSession) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <p style={sectionLabel}>Past sessions</p>
          <div style={{ display: "grid", gap: 12, marginTop: 14, opacity: 0.6 }}>
            {past.map((s: GatheringLiveSession) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      {sessions.length === 0 && (
        <div style={emptyStyle}>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            No live sessions scheduled yet.{isMod ? " Schedule one above." : ""}
          </p>
        </div>
      )}

    </div>
  );
}

function SessionCard({ session }: { session: GatheringLiveSession }) {
  return (
    <article style={cardStyle}>
      <p style={{ margin: 0, fontWeight: 600, color: "var(--cream)", fontSize: "1rem" }}>{session.title}</p>
      {session.description && (
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.65 }}>{session.description}</p>
      )}
      <p style={{ margin: 0, color: "var(--stone)", fontSize: 12, opacity: 0.6 }}>
        {new Date(session.starts_at).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
      </p>
    </article>
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
const inputStyle: React.CSSProperties = {
  borderRadius: 12, border: "1px solid var(--faint2)", background: "var(--bg2)",
  color: "var(--cream)", padding: "0.75rem 1rem", fontSize: 14,
  fontFamily: "'DM Sans', sans-serif", outline: "none",
  caretColor: "var(--companion)", width: "100%", boxSizing: "border-box",
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
  padding: "16px 20px", borderRadius: 16,
  border: "1px solid var(--faint)", background: "var(--card-surface)",
  display: "grid", gap: 8,
};
