import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getGathering,
  getMyMembership,
  listStudyPosts,
  listThreads,
  listPrayerRequests,
  listLiveSessions,
} from "@/app/actions/gatherings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GatheringHomePage({
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
  const isHost = membership?.role === "host";
  const isMod = membership?.role === "moderator" || isHost;
  const isMember = !!membership;

  const [studyPosts, threads, prayerRequests, liveSessions] = await Promise.all([
    listStudyPosts(gathering.id),
    listThreads(gathering.id),
    listPrayerRequests(gathering.id),
    listLiveSessions(gathering.id),
  ]);

  const upcomingSessions = liveSessions.filter(
    (s) => new Date(s.scheduled_at) > new Date() && !s.is_cancelled,
  );

  return (
    <div style={{ display: "grid", gap: 28 }}>

      {/* Description */}
      {gathering.description && (
        <p style={{ color: "var(--muted)", lineHeight: 1.75, fontSize: 15, margin: 0 }}>
          {gathering.description}
        </p>
      )}

      {/* Upcoming live */}
      {upcomingSessions.length > 0 && (
        <section style={{ ...sectionStyle, borderColor: "rgba(134,239,172,0.2)", background: "rgba(134,239,172,0.03)" }}>
          <p style={{ ...sectionLabel, color: "#86efac" }}>Upcoming</p>
          {upcomingSessions.slice(0, 1).map((s) => (
            <div key={s.id}>
              <p style={{ color: "var(--cream)", fontWeight: 600, margin: "0 0 4px" }}>{s.title}</p>
              <p style={{ color: "var(--stone)", fontSize: 13, margin: 0 }}>
                {new Date(s.scheduled_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          ))}
          <Link href={`/gatherings/${slug}/live`} style={linkStyle}>See all sessions →</Link>
        </section>
      )}

      {/* Quick overview grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>

        <Link href={`/gatherings/${slug}/study`} style={cardStyle}>
          <p style={sectionLabel}>Study</p>
          <p style={{ color: "var(--cream)", fontWeight: 600, fontSize: "1.6rem", margin: "4px 0" }}>
            {studyPosts.length}
          </p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            {studyPosts.length === 1 ? "post" : "posts"}
          </p>
          {isMod && (
            <span style={linkStyle}>+ New post</span>
          )}
        </Link>

        <Link href={`/gatherings/${slug}/discussion`} style={cardStyle}>
          <p style={sectionLabel}>Discussion</p>
          <p style={{ color: "var(--cream)", fontWeight: 600, fontSize: "1.6rem", margin: "4px 0" }}>
            {threads.length}
          </p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            {threads.length === 1 ? "thread" : "threads"}
          </p>
          {isMember && (
            <span style={linkStyle}>Start a thread →</span>
          )}
        </Link>

        <Link href={`/gatherings/${slug}/prayer`} style={cardStyle}>
          <p style={sectionLabel}>Prayer</p>
          <p style={{ color: "var(--cream)", fontWeight: 600, fontSize: "1.6rem", margin: "4px 0" }}>
            {prayerRequests.length}
          </p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            {prayerRequests.length === 1 ? "request" : "requests"}
          </p>
          {isMember && (
            <span style={linkStyle}>Share a request →</span>
          )}
        </Link>

      </div>

      {!isMember && user && (
        <p style={{ color: "var(--stone)", fontSize: 13, textAlign: "center", opacity: 0.6 }}>
          Join this gathering to participate in study, discussion, and prayer.
        </p>
      )}
      {!user && (
        <p style={{ color: "var(--stone)", fontSize: 13, textAlign: "center", opacity: 0.6 }}>
          <Link href="/auth/signin" style={{ color: "var(--companion)", textDecoration: "none" }}>Sign in</Link> to join and participate.
        </p>
      )}

    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: "20px 24px",
  borderRadius: 20,
  border: "1px solid var(--faint)",
  background: "var(--card-surface)",
  display: "grid",
  gap: 10,
};

const cardStyle: React.CSSProperties = {
  padding: "20px 24px",
  borderRadius: 20,
  border: "1px solid var(--faint)",
  background: "var(--card-surface)",
  display: "grid",
  gap: 4,
  textDecoration: "none",
  color: "inherit",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--stone)",
  margin: 0,
};

const linkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--stone)",
  textDecoration: "none",
  marginTop: 6,
  display: "inline-block",
};
